// Règles du workflow de remboursement (002, US4, T084, T086 ; FR-027 à FR-030, FR-035 ;
// research R14). Module pur, partagé par la validation de la collection `refunds`, les effets du
// workflow et la tâche d'alerte.
import { allocateAmount, refundAdjustment, type RefundReason } from '@/lib/checkout/commission';
import type { BookingStatus } from '@/lib/checkout/stateMachines';

export const REFUND_DEADLINE_DAYS = 14;
export const REFUND_ALERT_DAYS = 10;

const DAY_MS = 24 * 60 * 60 * 1000;

export type RefundStatus = 'requested' | 'approved' | 'paid' | 'rejected';

export type RefundDraft = {
  amount: number;
  calculatedAmount: number;
  lines: ReadonlyArray<{ lineId: string; amount: number }>;
  method: 'original' | 'wave' | 'orange_money' | 'bank_transfer';
  status: RefundStatus;
  adjustmentReason?: string | null;
  methodJustification?: string | null;
  rejectionReason?: string | null;
};

const blank = (value: string | null | undefined): boolean => !value || value.trim() === '';

/** Erreurs de saisie d'un remboursement (vide si valide). */
export const refundErrors = (refund: RefundDraft): string[] => {
  const errors: string[] = [];
  const sum = refund.lines.reduce((total, line) => total + line.amount, 0);
  if (refund.lines.length > 0 && sum !== refund.amount)
    errors.push('Le montant doit égaler la somme des lignes.');
  if (refund.amount < refund.calculatedAmount && blank(refund.adjustmentReason))
    errors.push('Montant inférieur au calcul des paliers : motif obligatoire.');
  if (refund.method !== 'original' && blank(refund.methodJustification))
    errors.push('Moyen de remboursement différent de l’original : justification obligatoire.');
  if (refund.status === 'rejected' && blank(refund.rejectionReason))
    errors.push('Refus : motif obligatoire.');
  return errors;
};

/** Date limite de versement : 14 jours après la validation (FR-029). */
export const refundDeadline = (approvedAt: string): Date =>
  new Date(new Date(approvedAt).getTime() + REFUND_DEADLINE_DAYS * DAY_MS);

/** Alerte à J+10 d'un remboursement validé et toujours pas versé. */
export const isRefundAlertDue = (
  refund: { status: RefundStatus; approvedAt?: string | null },
  now: Date,
): boolean =>
  refund.status === 'approved' &&
  Boolean(refund.approvedAt) &&
  now.getTime() - new Date(refund.approvedAt ?? '').getTime() >= REFUND_ALERT_DAYS * DAY_MS;

type BookingLineForRefund = {
  lineId: string;
  lineTotal: number;
  cancelled?: boolean | null;
  commissionRateBp?: number | null;
  partner?: number | null;
};

/** Encaissé de chaque ligne active (répartition de l'encaissé net au prorata des lignes). */
export const linePaidAmounts = (
  amountPaid: number,
  lines: ReadonlyArray<Pick<BookingLineForRefund, 'lineId' | 'lineTotal' | 'cancelled'>>,
): Map<string, number> =>
  new Map(
    allocateAmount(
      amountPaid,
      lines
        .filter((line) => !line.cancelled)
        .map((line) => ({ lineId: line.lineId, amount: line.lineTotal })),
    ).map((share) => [share.lineId, share.amount]),
  );

export type AdjustmentEntry = {
  lineId: string;
  partner: number | null;
  rateBp: number;
  grossAmount: number;
  commissionAmount: number;
  partnerAmount: number;
};

/**
 * Écritures d'ajustement de commission d'un remboursement versé (FR-035) : commission et part
 * prestataire réduites au prorata, sauf motif `partner` (la commission reste due).
 */
export const refundAdjustmentEntries = ({
  refundLines,
  bookingLines,
  reason,
}: {
  refundLines: ReadonlyArray<{ lineId: string; amount: number }>;
  bookingLines: readonly BookingLineForRefund[];
  reason: RefundReason;
}): AdjustmentEntry[] =>
  refundLines
    .filter((line) => line.amount > 0)
    .map((line) => {
      const bookingLine = bookingLines.find((candidate) => candidate.lineId === line.lineId);
      const rateBp = bookingLine?.commissionRateBp ?? 0;
      return {
        lineId: line.lineId,
        partner: bookingLine?.partner ?? null,
        rateBp,
        ...refundAdjustment({ refunded: line.amount, rateBp, reason }),
      };
    });

/** Statut de la réservation une fois le remboursement versé. */
export const bookingStatusAfterRefund = ({
  bookingLines,
  refundedLineIds,
}: {
  bookingLines: readonly BookingLineForRefund[];
  refundedLineIds: readonly string[];
}): BookingStatus => {
  const refunded = new Set(refundedLineIds);
  const remaining = bookingLines.filter((line) => !line.cancelled && !refunded.has(line.lineId));
  return remaining.length === 0 ? 'cancelled' : 'partially_cancelled';
};

/** Statut rendu après le refus d'une demande d'annulation (`paid` ou `deposit_paid`). */
export const bookingStatusAfterRejection = (booking: {
  amountPaid: number;
  total: number;
}): BookingStatus => (booking.amountPaid >= booking.total ? 'paid' : 'deposit_paid');
