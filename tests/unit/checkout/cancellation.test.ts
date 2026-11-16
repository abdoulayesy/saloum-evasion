import { describe, expect, it } from 'vitest';
import { applicableTier, cancellationRefund, refundableAmount } from '@/lib/checkout/cancellation';

// T012 (FR-025 à FR-027) : paliers d'annulation appliqués à l'encaissé réel.
const TIERS = [
  { daysBeforeArrivalMin: 30, refundPercent: 100 },
  { daysBeforeArrivalMin: 14, refundPercent: 50 },
  { daysBeforeArrivalMin: 0, refundPercent: 0 },
];

describe('annulation', () => {
  it('palier applicable : le plus grand délai inférieur ou égal aux jours restants', () => {
    expect(applicableTier(TIERS, 45)?.refundPercent).toBe(100);
    expect(applicableTier(TIERS, 30)?.refundPercent).toBe(100);
    expect(applicableTier(TIERS, 29)?.refundPercent).toBe(50);
    expect(applicableTier(TIERS, 14)?.refundPercent).toBe(50);
    expect(applicableTier(TIERS, 3)?.refundPercent).toBe(0);
    // Ordre de saisie indifférent ; aucun palier couvrant → rien.
    expect(applicableTier([...TIERS].reverse(), 20)?.refundPercent).toBe(50);
    expect(applicableTier([{ daysBeforeArrivalMin: 7, refundPercent: 100 }], 2)).toBeNull();
  });

  it('montant remboursable calculé sur l’encaissé réel (acompte), arrondi à l’entier', () => {
    expect(
      refundableAmount({ paid: 30_001, tiers: TIERS, daysRemaining: 20, reason: 'traveller' }),
    ).toBe(15_001);
    expect(
      refundableAmount({ paid: 30_000, tiers: TIERS, daysRemaining: 5, reason: 'traveller' }),
    ).toBe(0);
  });

  it('motifs `company` et `unavailable` : 100 % de l’encaissé, quel que soit le délai', () => {
    expect(
      refundableAmount({ paid: 80_000, tiers: TIERS, daysRemaining: 1, reason: 'company' }),
    ).toBe(80_000);
    expect(
      refundableAmount({ paid: 80_000, tiers: TIERS, daysRemaining: 1, reason: 'unavailable' }),
    ).toBe(80_000);
  });

  it('annulation partielle : seules les lignes choisies, chacune selon sa date et sa politique', () => {
    const result = cancellationRefund({
      today: '2027-01-01',
      reason: 'traveller',
      lineIds: ['lodge', 'pirogue'],
      lines: [
        { lineId: 'lodge', paid: 200_000, firstDate: '2027-02-15', tiers: TIERS },
        { lineId: 'pirogue', paid: 40_000, firstDate: '2027-01-20', tiers: TIERS },
        { lineId: 'transfer', paid: 45_000, firstDate: '2027-02-15', tiers: TIERS },
      ],
    });
    expect(result).toEqual({
      total: 220_000,
      lines: [
        { lineId: 'lodge', amount: 200_000, refundPercent: 100 },
        { lineId: 'pirogue', amount: 20_000, refundPercent: 50 },
      ],
    });
  });
});
