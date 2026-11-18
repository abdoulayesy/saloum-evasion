import { describe, expect, it } from 'vitest';
import { DEFAULT_RATES_BP, rateFor } from '@/lib/checkout/commissionRate';

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
