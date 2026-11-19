import { randomUUID } from 'node:crypto';
import {
  canTransitionPayment,
  isPaymentFinal,
  type PaymentStatus,
} from '@/lib/checkout/stateMachines';
import type { FailureReason, PaymentGateway } from './gateway';

// Traitement d'une notification de passerelle (002, T056 ; contrat payment-gateway). Logique
// indépendante du stockage (`NotifyStore`) pour être testée en mémoire (T044) :
// 1. signature invalide → journal + 401 ; 2. évènement déjà reçu → 200 sans effet ;
// 3. montant ou devise divergents → anomalie (finance alertée) ; 4. transitions de la machine
// à états, une notification vers un état antérieur est ignorée ; 5. succès → effets métier.

export type NotifyPayment = {
  id: number;
  status: PaymentStatus;
  amount: number;
  currency: string;
  gatewayReference?: string | null;
  failureReason?: FailureReason | null;
  confirmedAt?: string | null;
};

export type NotifyStore = {
  recordEvent: (event: {
    gatewayEventId: string;
    type: string;
    payload: unknown;
    signatureValid: boolean;
    paymentId?: number;
  }) => Promise<'recorded' | 'duplicate'>;
  findPayment: (
    gatewayReference: string,
    idempotencyKey: string | null,
  ) => Promise<NotifyPayment | null>;
  updatePayment: (
    id: number,
    data: { status: PaymentStatus; failureReason?: FailureReason; confirmedAt?: string },
  ) => Promise<void>;
  /** Effets d'un paiement réussi : réservation, commissions, notifications, panier commandé. */
  onSucceeded: (payment: NotifyPayment, paidAt: Date) => Promise<void>;
  alertAnomaly: (payment: NotifyPayment, detail: string) => Promise<void>;
};

export type NotifyResult =
  | 'invalid_signature'
  | 'duplicate'
  | 'unknown_payment'
  | 'ignored'
  | 'pending'
  | 'succeeded'
  | 'failed'
  | 'expired'
  | 'anomaly';

export type NotifyOutcome = { httpStatus: 200 | 401; result: NotifyResult };

/** Applique `target`, en passant par `pending` si la tentative est encore `initiated`. */
const moveTo = async (
  store: NotifyStore,
  payment: NotifyPayment,
  target: PaymentStatus,
  extra: { failureReason?: FailureReason; confirmedAt?: string } = {},
): Promise<boolean> => {
  if (
    payment.status === 'initiated' &&
    target !== 'pending' &&
    !canTransitionPayment('initiated', target)
  ) {
    await store.updatePayment(payment.id, { status: 'pending' });
    payment.status = 'pending';
  }
  if (!canTransitionPayment(payment.status, target)) return false;
  await store.updatePayment(payment.id, { status: target, ...extra });
  payment.status = target;
  return true;
};

export const processNotification = async (
  gateway: PaymentGateway,
  store: NotifyStore,
  rawBody: string,
  headers: Headers,
): Promise<NotifyOutcome> => {
  const verified = await gateway.verifyNotification(rawBody, headers);
  if (!verified) {
    await store.recordEvent({
      gatewayEventId: `invalid-${randomUUID()}`,
      type: 'invalid_signature',
      payload: { length: rawBody.length },
      signatureValid: false,
    });
    return { httpStatus: 401, result: 'invalid_signature' };
  }

  const payment = await store.findPayment(verified.gatewayReference, verified.idempotencyKey);
  const recorded = await store.recordEvent({
    gatewayEventId: verified.gatewayEventId,
    type: verified.result.status,
    payload: verified,
    signatureValid: true,
    paymentId: payment?.id,
  });
  if (recorded === 'duplicate') return { httpStatus: 200, result: 'duplicate' };
  if (!payment) return { httpStatus: 200, result: 'unknown_payment' };
  if (isPaymentFinal(payment.status)) return { httpStatus: 200, result: 'ignored' };

  const { result } = verified;
  switch (result.status) {
    case 'pending': {
      const moved = await moveTo(store, payment, 'pending');
      return { httpStatus: 200, result: moved ? 'pending' : 'ignored' };
    }
    case 'succeeded': {
      if (result.amountXof !== payment.amount || payment.currency !== 'XOF') {
        await moveTo(store, payment, 'failed', { failureReason: 'technical' });
        await store.alertAnomaly(
          payment,
          `Montant notifié ${result.amountXof} XOF ≠ montant attendu ${payment.amount} ${payment.currency}.`,
        );
        return { httpStatus: 200, result: 'anomaly' };
      }
      const moved = await moveTo(store, payment, 'succeeded', {
        confirmedAt: result.paidAt.toISOString(),
      });
      if (!moved) return { httpStatus: 200, result: 'ignored' };
      await store.onSucceeded(payment, result.paidAt);
      return { httpStatus: 200, result: 'succeeded' };
    }
    case 'failed': {
      const moved = await moveTo(store, payment, 'failed', { failureReason: result.reason });
      return { httpStatus: 200, result: moved ? 'failed' : 'ignored' };
    }
    case 'expired': {
      const moved = await moveTo(store, payment, 'expired');
      return { httpStatus: 200, result: moved ? 'expired' : 'ignored' };
    }
    default: {
      const unreachable: never = result;
      return unreachable;
    }
  }
};
