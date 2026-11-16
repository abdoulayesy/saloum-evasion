// Paliers d'annulation et montant remboursable (002, T015 ; FR-025 à FR-027). Module pur. Le
// calcul porte toujours sur l'encaissé réel de la ligne (acompte ou total), jamais sur son prix.

import type { RefundReason } from './commission';
import { daysBetween } from './deposit';

export type CancellationTier = { daysBeforeArrivalMin: number; refundPercent: number };

/** Palier dont le délai minimum est le plus grand qui reste ≤ jours restants ; `null` sinon. */
export const applicableTier = (
  tiers: readonly CancellationTier[],
  daysRemaining: number,
): CancellationTier | null =>
  tiers
    .filter((tier) => tier.daysBeforeArrivalMin <= daysRemaining)
    .reduce<CancellationTier | null>(
      (best, tier) =>
        best === null || tier.daysBeforeArrivalMin > best.daysBeforeArrivalMin ? tier : best,
      null,
    );

/** Motifs imputables à l'agence ou au prestataire indisponible : remboursement intégral. */
const FULL_REFUND_REASONS: ReadonlySet<RefundReason> = new Set(['company', 'unavailable']);

const refundPercentFor = (
  tiers: readonly CancellationTier[],
  daysRemaining: number,
  reason: RefundReason,
): number =>
  FULL_REFUND_REASONS.has(reason)
    ? 100
    : (applicableTier(tiers, daysRemaining)?.refundPercent ?? 0);

/** Montant remboursable, arrondi demi vers le haut à l'entier XOF. */
export const refundableAmount = ({
  paid,
  tiers,
  daysRemaining,
  reason,
}: {
  paid: number;
  tiers: readonly CancellationTier[];
  daysRemaining: number;
  reason: RefundReason;
}): number => Math.floor((paid * refundPercentFor(tiers, daysRemaining, reason) + 50) / 100);

type PaidLine = {
  lineId: string;
  paid: number;
  firstDate: string;
  tiers: readonly CancellationTier[];
};

type LineRefund = { lineId: string; amount: number; refundPercent: number };

/** Remboursement d'une annulation totale ou partielle (`lineIds` = lignes annulées). */
export const cancellationRefund = ({
  today,
  reason,
  lineIds,
  lines,
}: {
  today: string;
  reason: RefundReason;
  lineIds: readonly string[];
  lines: readonly PaidLine[];
}): { total: number; lines: LineRefund[] } => {
  const selected = new Set(lineIds);
  const refunds = lines
    .filter((line) => selected.has(line.lineId))
    .map((line) => {
      const daysRemaining = daysBetween(today, line.firstDate);
      return {
        lineId: line.lineId,
        amount: refundableAmount({ paid: line.paid, tiers: line.tiers, daysRemaining, reason }),
        refundPercent: refundPercentFor(line.tiers, daysRemaining, reason),
      };
    });
  return { total: refunds.reduce((sum, line) => sum + line.amount, 0), lines: refunds };
};
