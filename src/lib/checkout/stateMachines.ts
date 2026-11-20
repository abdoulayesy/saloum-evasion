// Machines à états des réservations et des tentatives de paiement (002, T016 ; data-model.md).
// Module pur : toute écriture de statut passe par `assertTransition`, qui refuse les retours en
// arrière et les sauts non prévus.

export const BOOKING_STATUSES = [
  'awaiting_payment',
  'deposit_paid',
  'paid',
  'expired',
  'cancellation_requested',
  'cancelled',
  'partially_cancelled',
  'completed',
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/**
 * Transitions autorisées. Le refus d'une demande d'annulation rend le statut précédent
 * (`deposit_paid` ou `paid`) : c'est la seule « marche arrière » admise.
 */
const BOOKING_TRANSITIONS: Readonly<Record<BookingStatus, readonly BookingStatus[]>> = {
  awaiting_payment: ['deposit_paid', 'paid', 'expired'],
  deposit_paid: ['paid', 'cancellation_requested', 'completed'],
  paid: ['cancellation_requested', 'completed'],
  cancellation_requested: ['deposit_paid', 'paid', 'cancelled', 'partially_cancelled'],
  partially_cancelled: ['completed'],
  expired: [],
  cancelled: [],
  completed: [],
};

export const PAYMENT_STATUSES = [
  'initiated',
  'pending',
  'succeeded',
  'failed',
  'abandoned',
  'expired',
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

const PAYMENT_TRANSITIONS: Readonly<Record<PaymentStatus, readonly PaymentStatus[]>> = {
  initiated: ['pending', 'abandoned', 'expired'],
  pending: ['succeeded', 'failed', 'expired'],
  succeeded: [],
  failed: [],
  abandoned: [],
  expired: [],
};

export const canTransitionBooking = (from: BookingStatus, to: BookingStatus): boolean =>
  BOOKING_TRANSITIONS[from].includes(to);

export const canTransitionPayment = (from: PaymentStatus, to: PaymentStatus): boolean =>
  PAYMENT_TRANSITIONS[from].includes(to);

export class InvalidTransitionError extends Error {
  constructor(entity: 'booking' | 'payment', from: string, to: string) {
    super(`Transition refusée (${entity}) : ${from} → ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

export const assertBookingTransition = (from: BookingStatus, to: BookingStatus): void => {
  if (!canTransitionBooking(from, to)) throw new InvalidTransitionError('booking', from, to);
};

export const assertPaymentTransition = (from: PaymentStatus, to: PaymentStatus): void => {
  if (!canTransitionPayment(from, to)) throw new InvalidTransitionError('payment', from, to);
};

/** Statut de paiement terminal : plus aucune notification ne peut le modifier (idempotence). */
export const isPaymentFinal = (status: PaymentStatus): boolean =>
  PAYMENT_TRANSITIONS[status].length === 0;

/** Statut obtenu après un paiement réussi, selon son objet. */
export const bookingStatusAfterPayment = (
  purpose: 'full' | 'deposit' | 'balance',
): BookingStatus => (purpose === 'deposit' ? 'deposit_paid' : 'paid');

/**
 * Le paiement réussi est-il déjà appliqué à la réservation ? Le statut de la tentative passe à
 * `succeeded` juste avant les effets métier (`applySuccessfulPayment`) : tant que la réservation
 * ne les reflète pas, la page de statut continue d'attendre au lieu d'afficher une réservation
 * encore « en attente de paiement ».
 */
export const isPaymentApplied = (
  payment: { status: PaymentStatus; purpose: 'full' | 'deposit' | 'balance' },
  booking: { status: BookingStatus },
): boolean => {
  if (payment.status !== 'succeeded') return false;
  if (payment.purpose === 'balance') return booking.status !== 'deposit_paid';
  return booking.status !== 'awaiting_payment';
};
