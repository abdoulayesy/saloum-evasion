// Contrat `PaymentGateway` (002, T029 ; contracts/payment-gateway.md) : isole le tunnel du
// prestataire de paiement. Implémentations : `fake` (dev, CI, E2E) et l'agrégateur retenu (T098).

export const PAYMENT_METHODS = ['wave', 'orange_money', 'card'] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const FAILURE_REASONS = [
  'declined',
  'insufficient_funds',
  'timeout',
  'cancelled_by_user',
  'technical',
] as const;

export type FailureReason = (typeof FAILURE_REASONS)[number];

export type CreateCheckoutInput = {
  /** UUID de la tentative (`payments.idempotencyKey`). */
  idempotencyKey: string;
  /** Entier strictement positif, recalculé côté serveur. */
  amountXof: number;
  method: PaymentMethod;
  /** SE-XXXXXX, affiché sur la page hébergée. */
  bookingReference: string;
  description: string;
  customer: { firstName: string; lastName: string; email: string; phoneE164: string };
  locale: 'fr' | 'en';
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
};

export type CreateCheckoutResult =
  | { ok: true; gatewayReference: string; redirectUrl: string; expiresAt: Date }
  | { ok: false; reason: 'method_unavailable' | 'invalid_request' | 'gateway_error' };

export type GatewayPaymentStatus =
  | { status: 'pending' }
  | { status: 'succeeded'; amountXof: number; paidAt: Date }
  | { status: 'failed'; reason: FailureReason }
  | { status: 'expired' };

export type VerifiedNotification = {
  gatewayEventId: string;
  gatewayReference: string;
  idempotencyKey: string | null;
  result: GatewayPaymentStatus;
};

export type RefundResult =
  | { ok: true; gatewayRefundReference: string }
  /** `not_supported` → remboursement manuel (R14). */
  | { ok: false; reason: 'not_supported' | 'gateway_error' };

export type PaymentGateway = {
  id: string;
  /** Doit contenir les trois moyens, au même rang (constitution VI). */
  supportedMethods: readonly PaymentMethod[];
  createCheckout: (input: CreateCheckoutInput) => Promise<CreateCheckoutResult>;
  getStatus: (gatewayReference: string) => Promise<GatewayPaymentStatus>;
  /** `null` = signature invalide. */
  verifyNotification: (rawBody: string, headers: Headers) => Promise<VerifiedNotification | null>;
  refund: (gatewayReference: string, amountXof: number) => Promise<RefundResult>;
};

export const isPaymentMethod = (value: unknown): value is PaymentMethod =>
  PAYMENT_METHODS.some((method) => method === value);

export const isFailureReason = (value: unknown): value is FailureReason =>
  FAILURE_REASONS.some((reason) => reason === value);

/** Montant acceptable par une passerelle : entier XOF strictement positif. */
export const isValidAmount = (amountXof: number): boolean =>
  Number.isInteger(amountXof) && amountXof > 0;
