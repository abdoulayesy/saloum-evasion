import { describe, expect, it } from 'vitest';
import { availabilityDeadline } from '@/lib/checkout/availabilityDeadline';

// T063 (FR-005) : confirmation de disponibilité sous 2 h entre 8 h et 20 h (Dakar = UTC), sinon
// 10 h le lendemain ; avant l'ouverture, 10 h le jour même.
const at = (iso: string) => new Date(iso);
const HOURS = { slaMinutes: 120, businessStart: '08:00', businessEnd: '20:00' };

describe('échéance de confirmation de disponibilité', () => {
  it('pendant les heures ouvrées : 2 h après le paiement', () => {
    expect(availabilityDeadline(at('2027-02-10T09:15:00Z'), HOURS).toISOString()).toBe(
      '2027-02-10T11:15:00.000Z',
    );
    expect(availabilityDeadline(at('2027-02-10T18:00:00Z'), HOURS).toISOString()).toBe(
      '2027-02-10T20:00:00.000Z',
    );
  });

  it('échéance au-delà de la fermeture : 10 h le lendemain', () => {
    expect(availabilityDeadline(at('2027-02-10T18:30:00Z'), HOURS).toISOString()).toBe(
      '2027-02-11T10:00:00.000Z',
    );
    expect(availabilityDeadline(at('2027-02-10T23:50:00Z'), HOURS).toISOString()).toBe(
      '2027-02-11T10:00:00.000Z',
    );
  });

  it('avant l’ouverture : 10 h le jour même', () => {
    expect(availabilityDeadline(at('2027-02-10T06:00:00Z'), HOURS).toISOString()).toBe(
      '2027-02-10T10:00:00.000Z',
    );
  });

  it('réglages du site pris en compte', () => {
    expect(
      availabilityDeadline(at('2027-02-10T09:00:00Z'), {
        slaMinutes: 60,
        businessStart: '07:00',
        businessEnd: '22:00',
      }).toISOString(),
    ).toBe('2027-02-10T10:00:00.000Z');
  });
});
