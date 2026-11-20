import { describe, expect, it } from 'vitest';
import { collectedEntry, refundAdjustment } from '@/lib/checkout/commission';
import { rateFor } from '@/lib/checkout/commissionRate';
import {
  buildStatement,
  csvCell,
  periodErrors,
  statementCsv,
  type StatementEntry,
  type StatementPayout,
} from '@/lib/checkout/statement';

// T091 (US5, FR-033 à FR-036) : relevé = écritures de la période − reversements de la période ;
// motif `partner` (la commission reste due) ; un changement de taux n'a pas d'effet rétroactif ;
// export CSV `;` en UTF-8 avec BOM.

const PERIOD = { from: '2026-11-01', to: '2026-11-30' };

const entry = (
  overrides: Partial<StatementEntry> & Pick<StatementEntry, 'grossAmount' | 'rateBp'>,
): StatementEntry => {
  const amounts =
    overrides.grossAmount >= 0
      ? collectedEntry({ gross: overrides.grossAmount, rateBp: overrides.rateBp })
      : refundAdjustment({
          refunded: -overrides.grossAmount,
          rateBp: overrides.rateBp,
          reason: 'traveller',
        });
  return {
    bookingReference: 'SE-ABC234',
    lineId: 'l1',
    lineTitle: 'Écolodge des bolongs',
    occurredAt: '2026-11-10T09:00:00.000Z',
    ...amounts,
    ...overrides,
  };
};

const payout = (overrides: Partial<StatementPayout> = {}): StatementPayout => ({
  periodStart: '2026-11-01',
  periodEnd: '2026-11-30',
  amount: 100_000,
  method: 'wave',
  reference: 'WAVE-1',
  paidAt: '2026-12-02T10:00:00.000Z',
  ...overrides,
});

describe('relevé prestataire', () => {
  it('somme des écritures de la période moins les reversements de la période', () => {
    const statement = buildStatement({
      period: PERIOD,
      entries: [
        entry({ grossAmount: 200_000, rateBp: 1500 }),
        entry({ grossAmount: 50_000, rateBp: 1500, occurredAt: '2026-11-30T23:59:59.000Z' }),
        // Hors période : ignorées.
        entry({ grossAmount: 999_000, rateBp: 1500, occurredAt: '2026-10-31T23:59:59.000Z' }),
        entry({ grossAmount: 999_000, rateBp: 1500, occurredAt: '2026-12-01T00:00:00.000Z' }),
      ],
      payouts: [
        payout(),
        // Reversement d'une autre période : ignoré.
        payout({ periodStart: '2026-10-01', periodEnd: '2026-10-31', amount: 77_000 }),
      ],
    });
    expect(statement.entries).toHaveLength(2);
    expect(statement.totals).toEqual({
      collected: 250_000,
      commission: 37_500,
      refunded: 0,
      commissionReversed: 0,
      netCommission: 37_500,
      partnerDue: 212_500,
      paidOut: 100_000,
      balance: 112_500,
    });
  });

  it('remboursement : commission et part réduites au prorata', () => {
    const statement = buildStatement({
      period: PERIOD,
      entries: [
        entry({ grossAmount: 100_000, rateBp: 2000 }),
        entry({ grossAmount: -50_000, rateBp: 2000, occurredAt: '2026-11-20T08:00:00.000Z' }),
      ],
      payouts: [],
    });
    expect(statement.totals).toMatchObject({
      collected: 100_000,
      commission: 20_000,
      refunded: 50_000,
      commissionReversed: 10_000,
      netCommission: 10_000,
      partnerDue: 40_000,
      balance: 40_000,
    });
  });

  it('motif `partner` : la commission reste due, le prestataire supporte le remboursement', () => {
    const adjustment = refundAdjustment({ refunded: 50_000, rateBp: 2000, reason: 'partner' });
    const statement = buildStatement({
      period: PERIOD,
      entries: [
        entry({ grossAmount: 100_000, rateBp: 2000 }),
        entry({ ...adjustment, rateBp: 2000 }),
      ],
      payouts: [],
    });
    expect(statement.totals).toMatchObject({
      refunded: 50_000,
      commissionReversed: 0,
      netCommission: 20_000,
      partnerDue: 30_000,
    });
  });

  it('cinq types d’offre et plusieurs prestataires : égal au calcul manuel', () => {
    // Taux figés au paiement : 15 % hébergement, 20 % expérience, 15 % table, 10 % transfert,
    // 25 % séjour. Le relevé d'un prestataire ne reçoit que ses écritures.
    const lodge = [
      entry({ grossAmount: 180_000, rateBp: 1500 }), // hébergement : 27 000
      entry({ grossAmount: 45_000, rateBp: 1000, lineId: 'l3' }), // transfert : 4 500
      entry({ grossAmount: 640_000, rateBp: 2500, lineId: 'l4' }), // séjour : 160 000
      entry({ grossAmount: -90_000, rateBp: 1500, occurredAt: '2026-11-25T12:00:00.000Z' }),
    ];
    const guide = [
      entry({ grossAmount: 35_000, rateBp: 2000, lineId: 'l2' }), // expérience : 7 000
      entry({ grossAmount: 12_345, rateBp: 1500, lineId: 'l5' }), // table : 1 851,75 → 1 852
    ];
    const lodgeStatement = buildStatement({ period: PERIOD, entries: lodge, payouts: [] });
    expect(lodgeStatement.totals).toMatchObject({
      collected: 865_000,
      commission: 191_500,
      refunded: 90_000,
      commissionReversed: 13_500,
      netCommission: 178_000,
      partnerDue: 865_000 - 191_500 - (90_000 - 13_500),
    });
    const guideStatement = buildStatement({ period: PERIOD, entries: guide, payouts: [] });
    expect(guideStatement.totals).toMatchObject({
      collected: 47_345,
      commission: 8_852,
      partnerDue: 38_493,
    });
  });

  it('changement de taux sans effet rétroactif : le relevé lit le taux figé de l’écriture', () => {
    const rates = [
      { offerType: 'experience' as const, rateBp: 2000, effectiveFrom: '2026-01-01' },
      { offerType: 'experience' as const, rateBp: 1200, effectiveFrom: '2026-11-15' },
    ];
    const before = entry({
      grossAmount: 100_000,
      rateBp: rateFor(rates, 'experience', '2026-11-10'),
    });
    const after = entry({
      grossAmount: 100_000,
      rateBp: rateFor(rates, 'experience', '2026-11-20'),
      occurredAt: '2026-11-20T09:00:00.000Z',
    });
    const statement = buildStatement({ period: PERIOD, entries: [before, after], payouts: [] });
    expect(statement.entries.map((line) => line.rateBp)).toEqual([2000, 1200]);
    expect(statement.totals.commission).toBe(20_000 + 12_000);
  });

  it('écritures et reversements triés par date', () => {
    const statement = buildStatement({
      period: PERIOD,
      entries: [
        entry({ grossAmount: 2, rateBp: 1000, occurredAt: '2026-11-20T00:00:00.000Z' }),
        entry({ grossAmount: 1, rateBp: 1000, occurredAt: '2026-11-02T00:00:00.000Z' }),
      ],
      payouts: [
        payout({ periodStart: '2026-11-16', paidAt: '2026-12-01T00:00:00.000Z', reference: 'B' }),
        payout({ periodEnd: '2026-11-15', paidAt: '2026-11-16T00:00:00.000Z', reference: 'A' }),
      ],
    });
    expect(statement.entries.map((line) => line.grossAmount)).toEqual([1, 2]);
    expect(statement.payouts.map((line) => line.reference)).toEqual(['A', 'B']);
  });
});

describe('période du relevé', () => {
  it('dates civiles valides, début avant la fin, au plus 366 jours', () => {
    expect(periodErrors(PERIOD)).toEqual([]);
    expect(periodErrors({ from: '2026-11-31', to: '2026-12-01' })).not.toEqual([]);
    expect(periodErrors({ from: '2026-12-01', to: '2026-11-01' })).not.toEqual([]);
    expect(periodErrors({ from: '2025-01-01', to: '2026-12-31' })).not.toEqual([]);
  });
});

describe('export CSV', () => {
  const statement = buildStatement({
    period: PERIOD,
    entries: [
      entry({ grossAmount: 200_000, rateBp: 1250, lineTitle: 'Pirogue; « coucher de soleil »' }),
      entry({ grossAmount: -50_000, rateBp: 1250, occurredAt: '2026-11-21T10:00:00.000Z' }),
    ],
    payouts: [payout({ amount: 50_000 })],
  });
  const csv = statementCsv({ partnerName: 'Écolodge "Les Palétuviers"', statement });

  it('UTF-8 avec BOM, séparateur `;`, fins de ligne CRLF', () => {
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toContain('\r\n');
    expect(csv.replace(/\r\n/g, '')).not.toContain('\n');
    expect(csv).toContain('Relevé prestataire;"Écolodge ""Les Palétuviers"""');
    expect(csv).toContain('Période;2026-11-01;2026-11-30');
  });

  it('montants entiers sans séparateur de milliers, taux à virgule décimale', () => {
    expect(csv).toContain(
      '2026-11-10;SE-ABC234;"Pirogue; « coucher de soleil »";Encaissement;200000;12,5;25000;175000',
    );
    expect(csv).toContain('Ajustement de remboursement;-50000;12,5;-6250;-43750');
    expect(csv).toContain('Reste à reverser;81250');
  });

  it('cellule de texte qui commencerait une formule : neutralisée', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');
    expect(csvCell('+221 77')).toBe("'+221 77");
    expect(csvCell(-6250)).toBe('-6250');
  });
});
