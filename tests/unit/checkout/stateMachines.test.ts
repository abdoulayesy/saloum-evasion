import { describe, expect, it } from 'vitest';
import {
  assertBookingTransition,
  assertPaymentTransition,
  bookingStatusAfterPayment,
  canTransitionBooking,
  canTransitionPayment,
  isPaymentFinal,
} from '@/lib/checkout/stateMachines';

// T013 : machines à états `bookings` et `payments` du data-model.
describe('machine à états des réservations', () => {
  it('parcours nominaux', () => {
    expect(canTransitionBooking('awaiting_payment', 'deposit_paid')).toBe(true);
    expect(canTransitionBooking('deposit_paid', 'paid')).toBe(true);
    expect(canTransitionBooking('awaiting_payment', 'paid')).toBe(true);
    expect(canTransitionBooking('awaiting_payment', 'expired')).toBe(true);
    expect(canTransitionBooking('paid', 'completed')).toBe(true);
    expect(canTransitionBooking('partially_cancelled', 'completed')).toBe(true);
  });

  it('annulation : demande, refus (retour au statut précédent), validation totale ou partielle', () => {
    expect(canTransitionBooking('paid', 'cancellation_requested')).toBe(true);
    expect(canTransitionBooking('cancellation_requested', 'paid')).toBe(true);
    expect(canTransitionBooking('cancellation_requested', 'cancelled')).toBe(true);
    expect(canTransitionBooking('cancellation_requested', 'partially_cancelled')).toBe(true);
  });

  it('retours en arrière et sauts refusés', () => {
    expect(canTransitionBooking('paid', 'deposit_paid')).toBe(false);
    expect(canTransitionBooking('paid', 'awaiting_payment')).toBe(false);
    expect(canTransitionBooking('expired', 'paid')).toBe(false);
    expect(canTransitionBooking('cancelled', 'paid')).toBe(false);
    expect(canTransitionBooking('awaiting_payment', 'cancellation_requested')).toBe(false);
    expect(() => assertBookingTransition('completed', 'cancellation_requested')).toThrow(
      /completed → cancellation_requested/,
    );
  });

  it('statut après paiement', () => {
    expect(bookingStatusAfterPayment('deposit')).toBe('deposit_paid');
    expect(bookingStatusAfterPayment('balance')).toBe('paid');
    expect(bookingStatusAfterPayment('full')).toBe('paid');
  });
});

describe('machine à états des paiements', () => {
  it('transitions autorisées', () => {
    expect(canTransitionPayment('initiated', 'pending')).toBe(true);
    expect(canTransitionPayment('pending', 'succeeded')).toBe(true);
    expect(canTransitionPayment('pending', 'failed')).toBe(true);
    expect(canTransitionPayment('pending', 'expired')).toBe(true);
    expect(canTransitionPayment('initiated', 'abandoned')).toBe(true);
  });

  it('statuts terminaux figés (notification rejouée sans effet)', () => {
    expect(isPaymentFinal('succeeded')).toBe(true);
    expect(isPaymentFinal('pending')).toBe(false);
    expect(canTransitionPayment('succeeded', 'failed')).toBe(false);
    expect(canTransitionPayment('failed', 'succeeded')).toBe(false);
    expect(() => assertPaymentTransition('succeeded', 'pending')).toThrow();
  });
});
