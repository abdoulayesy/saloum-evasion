import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import {
  isFailureReason,
  isValidAmount,
  PAYMENT_METHODS,
  type CreateCheckoutInput,
  type FailureReason,
  type GatewayPaymentStatus,
  type PaymentGateway,
  type VerifiedNotification,
} from './gateway';

// Passerelle factice (002, T031 ; contracts/payment-gateway.md) : page hébergée simulée
// (/dev/fake-gateway, absente en production) et notifications signées HMAC-SHA256 avec
// `FAKE_GATEWAY_SECRET`, envoyées au même point d'entrée que la production pour éprouver le vrai
// chemin de code. Les tentatives vivent en mémoire du processus (dev et E2E, un seul serveur).

export const FAKE_SIGNATURE_HEADER = 'x-fake-signature';

export const FAKE_OUTCOMES = [
  'succeeded',
  'insufficient_funds',
  'declined',
  'cancelled_by_user',
] as const;

export type FakeOutcome = (typeof FAKE_OUTCOMES)[number];

export type FakeCheckout = CreateCheckoutInput & {
  gatewayReference: string;
  expiresAt: Date;
  status: GatewayPaymentStatus;
};

type Store = Map<string, FakeCheckout>;

declare global {
  // Partagé entre les modules d'un même processus Next (route, page, action).
  var seFakeGatewayStore: Store | undefined;
}

const store = (): Store => {
  globalThis.seFakeGatewayStore ??= new Map();
  return globalThis.seFakeGatewayStore;
};

const CHECKOUT_TTL_MS = 30 * 60 * 1000;

const sign = (secret: string, body: string): string =>
  createHmac('sha256', secret).update(body).digest('hex');

const safeEqual = (a: string, b: string): boolean => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/** Corps de notification simulé, tel que l'enverrait un agrégateur. */
type FakeNotificationBody = {
  eventId: string;
  gatewayReference: string;
  idempotencyKey: string;
  outcome: FakeOutcome | 'expired';
  amountXof: number;
  occurredAt: string;
};

const statusOf = (body: FakeNotificationBody): GatewayPaymentStatus => {
  if (body.outcome === 'succeeded')
    return { status: 'succeeded', amountXof: body.amountXof, paidAt: new Date(body.occurredAt) };
  if (body.outcome === 'expired') return { status: 'expired' };
  const reason: FailureReason = isFailureReason(body.outcome) ? body.outcome : 'technical';
  return { status: 'failed', reason };
};

const parseNotification = (raw: string): FakeNotificationBody | null => {
  const data = parseJson(raw);
  if (!isRecord(data)) return null;
  const { eventId, gatewayReference, idempotencyKey, outcome, amountXof, occurredAt } = data;
  if (
    typeof eventId !== 'string' ||
    typeof gatewayReference !== 'string' ||
    typeof idempotencyKey !== 'string' ||
    typeof amountXof !== 'number' ||
    typeof occurredAt !== 'string'
  )
    return null;
  const knownOutcome = FAKE_OUTCOMES.find((candidate) => candidate === outcome);
  const parsedOutcome = outcome === 'expired' ? 'expired' : knownOutcome;
  if (!parsedOutcome) return null;
  return {
    eventId,
    gatewayReference,
    idempotencyKey,
    outcome: parsedOutcome,
    amountXof,
    occurredAt,
  };
};

export type FakeGateway = PaymentGateway & {
  /** Tentative connue de la page simulée. */
  findCheckout: (gatewayReference: string) => FakeCheckout | undefined;
  /** Issue choisie sur la page simulée : met à jour l'état et renvoie la notification signée. */
  simulate: (
    gatewayReference: string,
    outcome: FakeOutcome | 'expired',
  ) => { body: string; headers: Record<string, string> } | null;
};

export const createFakeGateway = ({
  secret,
  baseUrl,
}: {
  secret: string;
  baseUrl: string;
}): FakeGateway => ({
  id: 'fake',
  supportedMethods: PAYMENT_METHODS,

  createCheckout: async (input) => {
    if (!isValidAmount(input.amountXof)) return { ok: false, reason: 'invalid_request' };
    if (!PAYMENT_METHODS.includes(input.method)) return { ok: false, reason: 'method_unavailable' };
    const gatewayReference = `fake_${randomUUID()}`;
    const expiresAt = new Date(Date.now() + CHECKOUT_TTL_MS);
    store().set(gatewayReference, {
      ...input,
      gatewayReference,
      expiresAt,
      status: { status: 'pending' },
    });
    const redirectUrl = new URL('/dev/fake-gateway', baseUrl);
    redirectUrl.searchParams.set('ref', gatewayReference);
    return { ok: true, gatewayReference, redirectUrl: redirectUrl.toString(), expiresAt };
  },

  getStatus: async (gatewayReference) => {
    const checkout = store().get(gatewayReference);
    if (!checkout) return { status: 'pending' };
    if (checkout.status.status === 'pending' && checkout.expiresAt.getTime() < Date.now())
      return { status: 'expired' };
    return checkout.status;
  },

  verifyNotification: async (rawBody, headers): Promise<VerifiedNotification | null> => {
    const signature = headers.get(FAKE_SIGNATURE_HEADER);
    if (!signature || !safeEqual(signature, sign(secret, rawBody))) return null;
    const body = parseNotification(rawBody);
    if (!body) return null;
    return {
      gatewayEventId: body.eventId,
      gatewayReference: body.gatewayReference,
      idempotencyKey: body.idempotencyKey,
      result: statusOf(body),
    };
  },

  refund: async (gatewayReference) =>
    store().has(gatewayReference)
      ? { ok: true, gatewayRefundReference: `fake_refund_${randomUUID()}` }
      : { ok: false, reason: 'gateway_error' },

  findCheckout: (gatewayReference) => store().get(gatewayReference),

  simulate: (gatewayReference, outcome) => {
    const checkout = store().get(gatewayReference);
    if (!checkout) return null;
    const notification: FakeNotificationBody = {
      eventId: `evt_${randomUUID()}`,
      gatewayReference,
      idempotencyKey: checkout.idempotencyKey,
      outcome,
      amountXof: checkout.amountXof,
      occurredAt: new Date().toISOString(),
    };
    checkout.status = statusOf(notification);
    const body = JSON.stringify(notification);
    return {
      body,
      headers: { 'content-type': 'application/json', [FAKE_SIGNATURE_HEADER]: sign(secret, body) },
    };
  },
});
