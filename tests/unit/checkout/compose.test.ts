import { describe, expect, it } from 'vitest';
import {
  clampGuests,
  clampNights,
  estimateComposition,
  planComposition,
  type ComposeChoice,
} from '@/lib/checkout/compose';

// Composer mon séjour : plan des lignes du panier et estimation (mêmes prix que le panier).

const base: ComposeChoice = {
  startDate: '2026-12-10',
  nights: 3,
  guests: 2,
  lodging: { id: 23, lowSeasonPerNight: 45_000, highSeasonPerNight: 56_000 },
  experiences: [
    {
      id: 50,
      offerType: 'experience',
      pricePerPerson: 35_000,
      childPercent: 50,
      slots: ['09:00', '17:30'],
    },
    {
      id: 51,
      offerType: 'experience',
      pricePerPerson: 25_000,
      childPercent: 50,
      slots: ['09:00', '17:30'],
    },
    { id: 52, offerType: 'table', pricePerPerson: 12_000, childPercent: 50, slots: ['19:30'] },
  ],
  transfer: {
    id: 3,
    tiers: [
      { maxPassengers: 3, pricePerVehicle: 45_000 },
      { maxPassengers: 7, pricePerVehicle: 70_000 },
    ],
  },
};

describe('planComposition', () => {
  it('hébergement sur la durée choisie, expériences pendant le séjour, transfert aller-retour', () => {
    expect(planComposition(base)).toEqual([
      { offerType: 'accommodation', offerId: 23, startDate: '2026-12-10', endDate: '2026-12-13' },
      { offerType: 'experience', offerId: 50, date: '2026-12-11', slot: '09:00' },
      { offerType: 'experience', offerId: 51, date: '2026-12-12', slot: '17:30' },
      { offerType: 'table', offerId: 52, date: '2026-12-11', slot: '19:30' },
      {
        offerType: 'transfer',
        offerId: 3,
        outboundDate: '2026-12-10',
        outboundTime: '10:00',
        returnDate: '2026-12-13',
        returnTime: '15:00',
      },
    ]);
  });

  it('une seule nuit : expériences le jour de l’arrivée ; sans transfert ni créneau, rien de plus', () => {
    const lines = planComposition({
      ...base,
      nights: 1,
      transfer: null,
      experiences: [{ ...base.experiences[0]!, slots: [] }, base.experiences[1]!],
    });
    expect(lines).toEqual([
      { offerType: 'accommodation', offerId: 23, startDate: '2026-12-10', endDate: '2026-12-11' },
      { offerType: 'experience', offerId: 51, date: '2026-12-10', slot: '09:00' },
    ]);
  });

  it('borne les nuits entre 1 et 14', () => {
    expect(clampNights(0)).toBe(1);
    expect(clampNights(30)).toBe(14);
    expect(clampGuests(0)).toBe(1);
    expect(clampGuests(40)).toBe(12);
  });
});

describe('estimateComposition', () => {
  it('nuits × tarif, expériences × voyageurs, transfert facturé à l’aller et au retour', () => {
    const estimate = estimateComposition(base, []);
    expect(estimate.lines.map((line) => line.amount)).toEqual([
      135_000, 70_000, 50_000, 24_000, 90_000,
    ]);
    expect(estimate.total).toBe(369_000);
    expect(estimate.perGuest).toBe(184_500);
  });

  it('applique la saison haute aux nuits concernées', () => {
    const estimate = estimateComposition({ ...base, experiences: [], transfer: null }, [
      { from: '12-11', to: '12-31' },
    ]);
    expect(estimate.total).toBe(45_000 + 56_000 + 56_000);
  });
});
