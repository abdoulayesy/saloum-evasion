import { describe, expect, it } from 'vitest';
import {
  allocateAmount,
  assertCommissionRate,
  collectedEntry,
  commissionOf,
  refundAdjustment,
} from '@/lib/checkout/commission';

// T011 (FR-034, FR-035) : commissions en points de base, écritures immuables.
describe('commissions', () => {
  it('taux hors de la plage 1000–2500 refusés', () => {
    expect(() => assertCommissionRate(999)).toThrow();
    expect(() => assertCommissionRate(2501)).toThrow();
    expect(() => assertCommissionRate(1500.5)).toThrow();
    expect(() => assertCommissionRate(1000)).not.toThrow();
    expect(() => assertCommissionRate(2500)).not.toThrow();
  });

  it('arrondi demi vers le haut', () => {
    expect(commissionOf(10_005, 1000)).toBe(1001); // 1000,5 → 1001
    expect(commissionOf(10_004, 1000)).toBe(1000); // 1000,4 → 1000
    expect(commissionOf(333, 1500)).toBe(50); // 49,95 → 50
  });

  it('commission + part prestataire = encaissé', () => {
    const entry = collectedEntry({ gross: 487_351, rateBp: 2500 });
    expect(entry.commissionAmount + entry.partnerAmount).toBe(487_351);
    expect(entry).toMatchObject({
      kind: 'collected',
      grossAmount: 487_351,
      commissionAmount: 121_838,
    });
  });

  it('acompte : répartition au prorata des lignes, somme exacte', () => {
    const shares = allocateAmount(100_001, [
      { lineId: 'a', amount: 200_000 },
      { lineId: 'b', amount: 100_000 },
      { lineId: 'c', amount: 33_337 },
    ]);
    expect(shares.reduce((sum, share) => sum + share.amount, 0)).toBe(100_001);
    expect(shares.map((share) => share.lineId)).toEqual(['a', 'b', 'c']);
    // 59 999,94 / 29 999,97 / 10 001,09 : les deux plus forts restes reçoivent le franc manquant.
    expect(shares.map((share) => share.amount)).toEqual([60_000, 30_000, 10_001]);
  });

  it('acompte puis solde : commission cumulée identique à un paiement unique', () => {
    const deposit = collectedEntry({ gross: 30_001, rateBp: 1500 });
    const balance = collectedEntry({ gross: 70_002, rateBp: 1500, previouslyCollected: 30_001 });
    const once = collectedEntry({ gross: 100_003, rateBp: 1500 });
    expect(deposit.commissionAmount + balance.commissionAmount).toBe(once.commissionAmount);
  });

  it('remboursement : ajustement négatif, symétrique de l’encaissement', () => {
    const collected = collectedEntry({ gross: 100_003, rateBp: 1500 });
    const adjustment = refundAdjustment({ refunded: 100_003, rateBp: 1500, reason: 'traveller' });
    expect(adjustment).toMatchObject({ kind: 'refund_adjustment', grossAmount: -100_003 });
    expect(collected.commissionAmount + adjustment.commissionAmount).toBe(0);
    expect(adjustment.commissionAmount + adjustment.partnerAmount).toBe(-100_003);
  });

  it('motif `partner` : la commission reste due', () => {
    expect(refundAdjustment({ refunded: 50_000, rateBp: 2000, reason: 'partner' })).toEqual({
      kind: 'refund_adjustment',
      grossAmount: -50_000,
      commissionAmount: 0,
      partnerAmount: -50_000,
    });
  });
});
