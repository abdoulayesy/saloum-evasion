import { describe, expect, it } from 'vitest';
import {
  bookingStatusAfterRefund,
  bookingStatusAfterRejection,
  isRefundAlertDue,
  linePaidAmounts,
  refundAdjustmentEntries,
  refundDeadline,
  refundErrors,
  type RefundDraft,
} from '@/lib/booking/refundRules';

// T084 (US4, FR-027 à FR-030, FR-035 ; research R14) : montant ≥ calcul sauf motif,
// justification si autre moyen que l'original, refus motivé, versement sous 14 jours avec
// alerte à J+10, ajustements de commission au prorata (sauf motif prestataire).

const draft = (overrides: Partial<RefundDraft> = {}): RefundDraft => ({
  amount: 100_000,
  calculatedAmount: 100_000,
  lines: [{ lineId: 'lodge', amount: 100_000 }],
  method: 'original',
  status: 'requested',
  ...overrides,
});

const LINES = [
  { lineId: 'lodge', lineTotal: 200_000, commissionRateBp: 1500, partner: 7 },
  { lineId: 'pirogue', lineTotal: 50_000, commissionRateBp: 2000, partner: 9 },
];

describe('workflow de remboursement', () => {
  it('remboursement conforme : aucune erreur ; geste commercial (montant supérieur) admis', () => {
    expect(refundErrors(draft())).toEqual([]);
    expect(
      refundErrors(draft({ amount: 120_000, lines: [{ lineId: 'lodge', amount: 120_000 }] })),
    ).toEqual([]);
  });

  it('montant inférieur au calcul : motif obligatoire', () => {
    const lower = draft({ amount: 80_000, lines: [{ lineId: 'lodge', amount: 80_000 }] });
    expect(refundErrors(lower)).toContain(
      'Montant inférieur au calcul des paliers : motif obligatoire.',
    );
    expect(refundErrors({ ...lower, adjustmentReason: 'Accord écrit du voyageur' })).toEqual([]);
  });

  it('autre moyen que l’original : justification obligatoire', () => {
    expect(refundErrors(draft({ method: 'wave' }))).toHaveLength(1);
    expect(
      refundErrors(draft({ method: 'wave', methodJustification: 'Compte Orange Money fermé' })),
    ).toEqual([]);
  });

  it('refus motivé ; somme des lignes = montant', () => {
    expect(refundErrors(draft({ status: 'rejected' }))).toEqual(['Refus : motif obligatoire.']);
    expect(refundErrors(draft({ amount: 90_000 }))).toContain(
      'Le montant doit égaler la somme des lignes.',
    );
  });

  it('versement sous 14 jours, alerte à J+10 si toujours pas versé', () => {
    const approvedAt = '2027-01-01T10:00:00.000Z';
    expect(refundDeadline(approvedAt).toISOString()).toBe('2027-01-15T10:00:00.000Z');
    const after = (days: number) => new Date(Date.parse(approvedAt) + days * 86_400_000);
    expect(isRefundAlertDue({ status: 'approved', approvedAt }, after(9))).toBe(false);
    expect(isRefundAlertDue({ status: 'approved', approvedAt }, after(10))).toBe(true);
    expect(isRefundAlertDue({ status: 'paid', approvedAt }, after(12))).toBe(false);
  });

  it('ajustements : commission et part réduites au prorata du remboursé', () => {
    expect(
      refundAdjustmentEntries({
        refundLines: [{ lineId: 'lodge', amount: 100_000 }],
        bookingLines: LINES,
        reason: 'traveller',
      }),
    ).toEqual([
      {
        lineId: 'lodge',
        partner: 7,
        rateBp: 1500,
        kind: 'refund_adjustment',
        grossAmount: -100_000,
        commissionAmount: -15_000,
        partnerAmount: -85_000,
      },
    ]);
  });

  it('motif prestataire : la commission reste due, le prestataire supporte le remboursement', () => {
    const [entry] = refundAdjustmentEntries({
      refundLines: [{ lineId: 'pirogue', amount: 50_000 }],
      bookingLines: LINES,
      reason: 'partner',
    });
    expect(entry).toMatchObject({ commissionAmount: 0, partnerAmount: -50_000 });
  });

  it('encaissé par ligne au prorata (acompte de 30 %)', () => {
    const paid = linePaidAmounts(75_000, LINES);
    expect(paid.get('lodge')).toBe(60_000);
    expect(paid.get('pirogue')).toBe(15_000);
  });

  it('statut après versement : annulée ou partiellement annulée ; refus : statut précédent', () => {
    expect(bookingStatusAfterRefund({ bookingLines: LINES, refundedLineIds: ['lodge'] })).toBe(
      'partially_cancelled',
    );
    expect(
      bookingStatusAfterRefund({ bookingLines: LINES, refundedLineIds: ['lodge', 'pirogue'] }),
    ).toBe('cancelled');
    expect(bookingStatusAfterRejection({ amountPaid: 250_000, total: 250_000 })).toBe('paid');
    expect(bookingStatusAfterRejection({ amountPaid: 75_000, total: 250_000 })).toBe(
      'deposit_paid',
    );
  });
});
