import { cancellationRefund, type CancellationTier } from '@/lib/checkout/cancellation';
import type { Booking } from '@/payload-types';
import { linePaidAmounts } from './refundRules';

// Montant remboursable d'une annulation à la date du jour (002, US4, T085 ; FR-027) : paliers
// des conditions figées au paiement (`policySnapshot`), encaissé réel de chaque ligne. Affiché
// avant la confirmation puis enregistré tel quel dans la demande de remboursement.

export type QuoteLine = {
  lineId: string;
  title: string;
  startDate: string;
  paid: number;
  refundPercent: number;
  amount: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Paliers de la copie figée des conditions (aucun palier : rien de remboursable). */
export const tiersOf = (snapshot: unknown): CancellationTier[] => {
  const tiers = isRecord(snapshot) && Array.isArray(snapshot.tiers) ? snapshot.tiers : [];
  return tiers.flatMap((tier) =>
    isRecord(tier) &&
    typeof tier.daysBeforeArrivalMin === 'number' &&
    typeof tier.refundPercent === 'number'
      ? [{ daysBeforeArrivalMin: tier.daysBeforeArrivalMin, refundPercent: tier.refundPercent }]
      : [],
  );
};

/** Lignes encore actives d'une réservation, avec leur montant remboursable aujourd'hui. */
export const cancellationQuote = (booking: Booking, today: string): QuoteLine[] => {
  const active = (booking.lines ?? []).filter((line) => !line.cancelled);
  const paid = linePaidAmounts(
    booking.amountPaid,
    active.map((line) => ({ lineId: line.lineId, lineTotal: line.lineTotal })),
  );
  const { lines } = cancellationRefund({
    today,
    reason: 'traveller',
    lineIds: active.map((line) => line.lineId),
    lines: active.map((line) => ({
      lineId: line.lineId,
      paid: paid.get(line.lineId) ?? 0,
      firstDate: line.startDate,
      tiers: tiersOf(line.policySnapshot),
    })),
  });
  return active.map((line) => {
    const refund = lines.find((candidate) => candidate.lineId === line.lineId);
    return {
      lineId: line.lineId,
      title: line.title,
      startDate: line.startDate,
      paid: paid.get(line.lineId) ?? 0,
      refundPercent: refund?.refundPercent ?? 0,
      amount: refund?.amount ?? 0,
    };
  });
};

/** Une annulation peut-elle être demandée en ligne ? (payée, sans demande en cours) */
export const canRequestCancellation = (booking: Pick<Booking, 'status'>): boolean =>
  booking.status === 'paid' || booking.status === 'deposit_paid';
