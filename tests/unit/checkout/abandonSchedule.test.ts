import { describe, expect, it } from 'vitest';
import { dueAbandonReminder } from '@/lib/checkout/abandonSchedule';

// FR-031 (US3, T078) : relances à 1 h et 24 h, au plus deux, seulement avec consentement, jamais
// pour un panier payé ni pendant qu'un paiement est en cours de confirmation.

const LAST = '2027-01-10T10:00:00Z';
const after = (hours: number) => new Date(new Date(LAST).getTime() + hours * 60 * 60 * 1000);

const noneSent: number[] = [];

const base = {
  consent: true,
  cartStatus: 'open',
  bookingStatus: 'awaiting_payment',
  paymentInProgress: false,
  lastActivityAt: LAST,
  sentRanks: noneSent,
};

describe('relances de panier abandonné', () => {
  it('rien avant 1 h, première relance à 1 h, seconde à 24 h', () => {
    expect(dueAbandonReminder({ ...base, now: after(0.9) })).toBeNull();
    expect(dueAbandonReminder({ ...base, now: after(1) })).toBe(1);
    expect(dueAbandonReminder({ ...base, now: after(5), sentRanks: [1] })).toBeNull();
    expect(dueAbandonReminder({ ...base, now: after(24), sentRanks: [1] })).toBe(2);
  });

  it('au plus deux relances, jamais deux fois la même', () => {
    expect(dueAbandonReminder({ ...base, now: after(30), sentRanks: [1, 2] })).toBeNull();
    expect(dueAbandonReminder({ ...base, now: after(30), sentRanks: [2] })).toBeNull();
  });

  it('tâche interrompue : seule la relance la plus récente part', () => {
    expect(dueAbandonReminder({ ...base, now: after(26) })).toBe(2);
  });

  it('sans consentement, panier commandé, réservation payée ou paiement en cours : rien', () => {
    const now = after(2);
    expect(dueAbandonReminder({ ...base, now, consent: false })).toBeNull();
    expect(dueAbandonReminder({ ...base, now, cartStatus: 'checked_out' })).toBeNull();
    expect(dueAbandonReminder({ ...base, now, bookingStatus: 'paid' })).toBeNull();
    expect(dueAbandonReminder({ ...base, now, paymentInProgress: true })).toBeNull();
  });

  it('plus rien après 7 jours', () => {
    expect(dueAbandonReminder({ ...base, now: after(7 * 24 + 1) })).toBeNull();
  });
});
