import { describe, expect, it } from 'vitest';
import {
  isCartPurgeDue,
  isCompletionDue,
  isUnpaidBookingExpiryDue,
  lastServiceDate,
  purgeCutoff,
} from '@/lib/booking/lifecycle';

// T100 : paniers non payés supprimés 30 jours après leur dernière modification ; réservation
// jamais payée expirée au même terme ; passage `completed` après la dernière prestation.

const NOW = new Date('2026-12-31T12:00:00.000Z');
const DAYS_30_AGO = '2026-12-01T12:00:00.000Z';
const DAYS_29_AGO = '2026-12-02T12:00:00.000Z';

describe('purge des paniers', () => {
  it('panier non commandé inchangé depuis 30 jours', () => {
    expect(isCartPurgeDue({ status: 'open', updatedAt: DAYS_30_AGO }, NOW)).toBe(true);
    expect(isCartPurgeDue({ status: 'abandoned', updatedAt: DAYS_30_AGO }, NOW)).toBe(true);
    expect(isCartPurgeDue({ status: 'expired', updatedAt: DAYS_30_AGO }, NOW)).toBe(true);
    expect(isCartPurgeDue({ status: 'open', updatedAt: DAYS_29_AGO }, NOW)).toBe(false);
  });

  it('panier commandé : jamais supprimé', () => {
    expect(isCartPurgeDue({ status: 'checked_out', updatedAt: '2020-01-01T00:00:00Z' }, NOW)).toBe(
      false,
    );
  });

  it('date limite de la requête', () => {
    expect(purgeCutoff(NOW)).toBe(DAYS_30_AGO);
  });
});

describe('réservation jamais payée', () => {
  it('expirée à 30 jours sans modification', () => {
    const booking = { status: 'awaiting_payment', amountPaid: 0, updatedAt: DAYS_30_AGO };
    expect(isUnpaidBookingExpiryDue(booking, NOW)).toBe(true);
    expect(isUnpaidBookingExpiryDue({ ...booking, updatedAt: DAYS_29_AGO }, NOW)).toBe(false);
    expect(isUnpaidBookingExpiryDue({ ...booking, status: 'paid' }, NOW)).toBe(false);
    expect(isUnpaidBookingExpiryDue({ ...booking, amountPaid: 1 }, NOW)).toBe(false);
  });
});

describe('passage « terminée »', () => {
  const lines = [
    { startDate: '2026-12-20', endDate: '2026-12-23' },
    { startDate: '2026-12-24', endDate: null },
    { startDate: '2026-12-28', endDate: '2026-12-30', cancelled: true },
  ];

  it('dernier jour de prestation des lignes actives', () => {
    expect(lastServiceDate(lines)).toBe('2026-12-24');
    expect(lastServiceDate([])).toBeNull();
    expect(lastServiceDate([{ startDate: '2026-12-01', cancelled: true }])).toBeNull();
  });

  it('le lendemain de la dernière prestation', () => {
    expect(isCompletionDue({ status: 'paid', lines }, '2026-12-24')).toBe(false);
    expect(isCompletionDue({ status: 'paid', lines }, '2026-12-25')).toBe(true);
    expect(isCompletionDue({ status: 'deposit_paid', lines }, '2026-12-25')).toBe(true);
    expect(isCompletionDue({ status: 'partially_cancelled', lines }, '2026-12-25')).toBe(true);
  });

  it('jamais pendant une annulation, ni après expiration ou annulation', () => {
    for (const status of ['cancellation_requested', 'cancelled', 'expired', 'awaiting_payment']) {
      expect(isCompletionDue({ status, lines }, '2027-01-10')).toBe(false);
    }
  });
});
