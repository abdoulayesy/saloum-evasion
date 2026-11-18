import { describe, expect, it } from 'vitest';
import { createFakeGateway } from '@/lib/payments/fake';
import type { CreateCheckoutInput } from '@/lib/payments/gateway';
import { processNotification, type NotifyPayment, type NotifyStore } from '@/lib/payments/notify';

// T044 (contrat payment-gateway, « Traitement d'une notification ») : signature invalide 401,
// doublon 200 sans effet, montant divergent ⇒ anomalie, transition vers un état antérieur
// ignorée, succès ⇒ effets métier (réservation, commissions, notifications) une seule fois.

const gateway = createFakeGateway({ secret: 'notify-secret', baseUrl: 'http://localhost:3000' });

const memoryStore = (payment: NotifyPayment) => {
  const events = new Set<string>();
  const calls = { succeeded: 0, anomalies: 0, recordedInvalid: 0 };
  const store: NotifyStore = {
    recordEvent: async ({ gatewayEventId, signatureValid }) => {
      if (!signatureValid) calls.recordedInvalid += 1;
      if (events.has(gatewayEventId)) return 'duplicate';
      events.add(gatewayEventId);
      return 'recorded';
    },
    findPayment: async (reference) => (reference === payment.gatewayReference ? payment : null),
    updatePayment: async (_id, data) => {
      Object.assign(payment, data);
    },
    onSucceeded: async () => {
      calls.succeeded += 1;
    },
    alertAnomaly: async () => {
      calls.anomalies += 1;
    },
  };
  return { store, calls, payment };
};

const checkoutInput = (amountXof: number): CreateCheckoutInput => ({
  idempotencyKey: crypto.randomUUID(),
  amountXof,
  method: 'wave',
  bookingReference: 'SE-7KD3QP',
  description: 'Test',
  customer: {
    firstName: 'Awa',
    lastName: 'Diop',
    email: 'awa@example.sn',
    phoneE164: '+221771234567',
  },
  locale: 'fr',
  returnUrl: 'http://localhost:3000/fr/commande/statut?p=1',
  cancelUrl: 'http://localhost:3000/fr/commande/statut?p=1&cancelled=1',
  notifyUrl: 'http://localhost:3000/api/payments/notify/fake',
});

const setup = async (paymentAmount: number, gatewayAmount = paymentAmount) => {
  const created = await gateway.createCheckout(checkoutInput(gatewayAmount));
  if (!created.ok) throw new Error('création refusée');
  const payment: NotifyPayment = {
    id: 1,
    status: 'pending',
    amount: paymentAmount,
    currency: 'XOF',
    gatewayReference: created.gatewayReference,
  };
  const notify = (outcome: 'succeeded' | 'insufficient_funds' | 'expired') => {
    const signed = gateway.simulate(created.gatewayReference, outcome);
    if (!signed) throw new Error('tentative inconnue');
    return { body: signed.body, headers: new Headers(signed.headers) };
  };
  return { ...memoryStore(payment), notify };
};

describe('traitement des notifications de paiement', () => {
  it('signature invalide : 401, journalisée, aucun effet', async () => {
    const { store, calls, notify, payment } = await setup(146_300);
    const { body } = notify('succeeded');
    const outcome = await processNotification(gateway, store, body, new Headers());
    expect(outcome).toEqual({ httpStatus: 401, result: 'invalid_signature' });
    expect(calls.recordedInvalid).toBe(1);
    expect(payment.status).toBe('pending');
  });

  it('succès : paiement réussi et effets métier exécutés une seule fois, doublon sans effet', async () => {
    const { store, calls, notify, payment } = await setup(146_300);
    const { body, headers } = notify('succeeded');
    expect(await processNotification(gateway, store, body, headers)).toEqual({
      httpStatus: 200,
      result: 'succeeded',
    });
    expect(payment.status).toBe('succeeded');
    expect(await processNotification(gateway, store, body, headers)).toEqual({
      httpStatus: 200,
      result: 'duplicate',
    });
    expect(calls.succeeded).toBe(1);
  });

  it('montant divergent : anomalie signalée, paiement échoué, aucun effet métier', async () => {
    const { store, calls, notify, payment } = await setup(146_300, 100);
    const { body, headers } = notify('succeeded');
    expect(await processNotification(gateway, store, body, headers)).toEqual({
      httpStatus: 200,
      result: 'anomaly',
    });
    expect(calls.anomalies).toBe(1);
    expect(calls.succeeded).toBe(0);
    expect(payment.status).toBe('failed');
    expect(payment.failureReason).toBe('technical');
  });

  it('échec : cause enregistrée', async () => {
    const { store, notify, payment } = await setup(146_300);
    const { body, headers } = notify('insufficient_funds');
    expect(await processNotification(gateway, store, body, headers)).toEqual({
      httpStatus: 200,
      result: 'failed',
    });
    expect(payment).toMatchObject({ status: 'failed', failureReason: 'insufficient_funds' });
  });

  it('notification tardive vers un état antérieur : ignorée', async () => {
    const { store, calls, notify, payment } = await setup(146_300);
    const success = notify('succeeded');
    await processNotification(gateway, store, success.body, success.headers);
    const late = notify('expired');
    expect(await processNotification(gateway, store, late.body, late.headers)).toEqual({
      httpStatus: 200,
      result: 'ignored',
    });
    expect(payment.status).toBe('succeeded');
    expect(calls.succeeded).toBe(1);
  });

  it('tentative inconnue : 200 sans effet', async () => {
    const { store, notify, payment } = await setup(146_300);
    payment.gatewayReference = 'autre';
    const { body, headers } = notify('succeeded');
    expect(await processNotification(gateway, store, body, headers)).toEqual({
      httpStatus: 200,
      result: 'unknown_payment',
    });
  });
});
