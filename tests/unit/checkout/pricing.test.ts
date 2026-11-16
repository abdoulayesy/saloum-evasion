import { describe, expect, it } from 'vitest';
import {
  accommodationPrice,
  experiencePrice,
  isHighSeason,
  stayPrice,
  transferPrice,
  type ChildPricing,
} from '@/lib/checkout/pricing';
import { toEurIndicative } from '@/lib/pricing';

// T009 (FR-008, FR-009, FR-041) : tarification en XOF entiers, côté serveur.
const HIGH_SEASONS = [{ from: '11-01', to: '04-30' }];
const CHILD: ChildPricing = { childPercent: 50, childMinAge: 4, childMaxAge: 11 };

describe('tarification', () => {
  it('saison haute, y compris à cheval sur le nouvel an', () => {
    expect(isHighSeason('2026-12-31', HIGH_SEASONS)).toBe(true);
    expect(isHighSeason('2027-01-15', HIGH_SEASONS)).toBe(true);
    expect(isHighSeason('2027-04-30', HIGH_SEASONS)).toBe(true);
    expect(isHighSeason('2027-05-01', HIGH_SEASONS)).toBe(false);
    expect(isHighSeason('2027-07-14', [])).toBe(false);
  });

  it('hébergement : chaque nuit au tarif de sa saison', () => {
    // 29/04 (haute), 30/04 (haute), 01/05 (basse) → 3 nuits.
    const price = accommodationPrice(
      { lowSeasonPerNight: 80_000, highSeasonPerNight: 120_000 },
      { startDate: '2027-04-29', endDate: '2027-05-02' },
      HIGH_SEASONS,
    );
    expect(price).toEqual({ nights: 3, unitPrice: 106_667, total: 320_000 });
  });

  it('expérience : adultes plein tarif, enfants 4–11 ans à 50 %, moins de 4 ans gratuits', () => {
    // 3 adultes (dont un enfant de 12 ans) × 25 000 ; 2 enfants × 12 500 ; 1 bébé gratuit.
    const price = experiencePrice(
      { pricePerPerson: 25_000, child: CHILD },
      { adults: 3, children: 2, infants: 1 },
    );
    expect(price.total).toBe(100_000);
    // Pourcentage réglable par offre.
    expect(
      experiencePrice(
        { pricePerPerson: 25_000, child: { ...CHILD, childPercent: 0 } },
        { adults: 1, children: 2, infants: 0 },
      ).total,
    ).toBe(25_000);
  });

  it('séjour signature : prix par personne selon la saison de la date d’arrivée', () => {
    const offer = { lowSeasonPerPerson: 150_000, highSeasonPerPerson: 190_000, child: CHILD };
    expect(
      stayPrice(
        offer,
        { startDate: '2027-02-10', adults: 2, children: 0, infants: 0 },
        HIGH_SEASONS,
      ).total,
    ).toBe(380_000);
    expect(
      stayPrice(
        offer,
        { startDate: '2027-06-10', adults: 2, children: 1, infants: 0 },
        HIGH_SEASONS,
      ).total,
    ).toBe(375_000);
  });

  it('transfert : prix par véhicule selon la tranche de passagers (bébés compris)', () => {
    const tiers = [
      { maxPassengers: 3, pricePerVehicle: 45_000 },
      { maxPassengers: 7, pricePerVehicle: 70_000 },
      { maxPassengers: 14, pricePerVehicle: 110_000 },
    ];
    expect(transferPrice(tiers, 2)).toEqual({ total: 45_000, vehicles: 1 });
    expect(transferPrice(tiers, 3)).toEqual({ total: 45_000, vehicles: 1 });
    expect(transferPrice(tiers, 4)).toEqual({ total: 70_000, vehicles: 1 });
    expect(transferPrice(tiers, 14)).toEqual({ total: 110_000, vehicles: 1 });
    // Au-delà de la plus grande tranche : plusieurs véhicules.
    expect(transferPrice(tiers, 17)).toEqual({ total: 155_000, vehicles: 2 });
  });

  it('montants entiers et conversion euro indicative (655,957)', () => {
    const price = experiencePrice(
      { pricePerPerson: 33_333, child: CHILD },
      { adults: 1, children: 1, infants: 0 },
    );
    expect(Number.isInteger(price.total)).toBe(true);
    expect(price.total).toBe(50_000); // 33 333 + 16 667 (arrondi à l'entier)
    // Conversion de la 001 : arrondi à l'euro supérieur, toujours « indicative ».
    expect(toEurIndicative(65_595)).toBe(100);
    expect(toEurIndicative(65_596)).toBe(101);
  });
});
