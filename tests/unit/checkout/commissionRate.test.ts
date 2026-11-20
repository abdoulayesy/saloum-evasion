import { describe, expect, it } from 'vitest';
import { DEFAULT_RATES_BP, rateFor, rateHistoryErrors } from '@/lib/checkout/commissionRate';

// FR-034 : taux historisé, le plus récent en vigueur, repli sur les défauts.
describe('taux de commission en vigueur', () => {
  const rates = [
    { offerType: 'experience' as const, rateBp: 2000, effectiveFrom: '2026-01-01' },
    { offerType: 'experience' as const, rateBp: 1800, effectiveFrom: '2027-03-01' },
    { offerType: 'stay' as const, rateBp: 2400, effectiveFrom: '2026-06-01' },
  ];

  it('le plus récent dont la date d’effet est passée', () => {
    expect(rateFor(rates, 'experience', '2027-02-28')).toBe(2000);
    expect(rateFor(rates, 'experience', '2027-03-01')).toBe(1800);
    expect(rateFor(rates, 'stay', '2027-01-01')).toBe(2400);
  });

  it('repli sur les défauts du data-model', () => {
    expect(rateFor(rates, 'transfer', '2027-01-01')).toBe(DEFAULT_RATES_BP.transfer);
    expect(rateFor(rates, 'stay', '2026-01-01')).toBe(2500);
  });
});
// T096 : historique sans effet rétroactif.
describe('historique des taux', () => {
  const history = [
    { offerType: 'experience' as const, rateBp: 2000, effectiveFrom: '2026-01-01' },
    { offerType: 'experience' as const, rateBp: 1800, effectiveFrom: '2027-03-01' },
  ];

  it('ajouter un taux qui prend effet aujourd’hui ou plus tard', () => {
    const next = [
      ...history,
      { offerType: 'stay' as const, rateBp: 2200, effectiveFrom: '2026-11-20' },
    ];
    expect(rateHistoryErrors(history, next, '2026-11-20')).toEqual([]);
  });

  it('première saisie : dates libres', () => {
    expect(rateHistoryErrors([], history, '2026-11-20')).toEqual([]);
  });

  it('un taux à venir se modifie ou se supprime encore', () => {
    expect(rateHistoryErrors(history, history.slice(0, 1), '2026-11-20')).toEqual([]);
  });

  it('un taux déjà en vigueur ne se modifie ni ne se supprime', () => {
    const edited = [{ ...history[0]!, rateBp: 1200 }, history[1]!];
    expect(rateHistoryErrors(history, edited, '2026-11-20')).toHaveLength(2);
    expect(rateHistoryErrors(history, history.slice(1), '2026-11-20')).toHaveLength(1);
  });

  it('pas de nouveau taux à date d’effet passée', () => {
    const next = [
      ...history,
      { offerType: 'table' as const, rateBp: 1200, effectiveFrom: '2026-06-01' },
    ];
    expect(rateHistoryErrors(history, next, '2026-11-20')).toEqual([
      'Un nouveau taux prend effet aujourd’hui au plus tôt.',
    ]);
  });
});
