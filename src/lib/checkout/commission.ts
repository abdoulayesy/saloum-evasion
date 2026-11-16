// Commissions par prestataire (002, T015 ; FR-034, FR-035). Module pur. Taux en points de base
// (1500 = 15 %), montants en XOF entiers, arrondi demi vers le haut.

export const MIN_COMMISSION_BP = 1000;
export const MAX_COMMISSION_BP = 2500;

export const assertCommissionRate = (rateBp: number): void => {
  if (!Number.isInteger(rateBp) || rateBp < MIN_COMMISSION_BP || rateBp > MAX_COMMISSION_BP) {
    throw new RangeError(
      `Taux de commission invalide : ${rateBp} pb (attendu ${MIN_COMMISSION_BP}–${MAX_COMMISSION_BP}).`,
    );
  }
};

/** Commission sur un montant positif, arrondie demi vers le haut (calcul entier, sans flottant). */
export const commissionOf = (amount: number, rateBp: number): number => {
  assertCommissionRate(rateBp);
  return Math.floor((amount * rateBp + 5_000) / 10_000);
};

export type RefundReason = 'traveller' | 'company' | 'partner' | 'unavailable';

export type CommissionEntryAmounts = {
  kind: 'collected' | 'refund_adjustment';
  grossAmount: number;
  commissionAmount: number;
  partnerAmount: number;
};

/**
 * Écriture d'encaissement. En acompte puis solde, la commission du solde est calculée sur le
 * cumul encaissé moins ce qui a déjà été reconnu : la somme reste exacte, sans écart d'arrondi.
 */
export const collectedEntry = ({
  gross,
  rateBp,
  previouslyCollected = 0,
}: {
  gross: number;
  rateBp: number;
  previouslyCollected?: number;
}): CommissionEntryAmounts => {
  const commission =
    commissionOf(previouslyCollected + gross, rateBp) - commissionOf(previouslyCollected, rateBp);
  return {
    kind: 'collected',
    grossAmount: gross,
    commissionAmount: commission,
    partnerAmount: gross - commission,
  };
};

/**
 * Écriture d'ajustement après remboursement (montants négatifs). Motif `partner` : la commission
 * reste due à l'agence, le prestataire supporte tout le remboursement (FR-035).
 */
export const refundAdjustment = ({
  refunded,
  rateBp,
  reason,
}: {
  refunded: number;
  rateBp: number;
  reason: RefundReason;
}): CommissionEntryAmounts => {
  const commission = reason === 'partner' ? 0 : -commissionOf(refunded, rateBp);
  return {
    kind: 'refund_adjustment',
    grossAmount: -refunded,
    commissionAmount: commission,
    partnerAmount: -refunded - commission,
  };
};

type Share = { lineId: string; amount: number };

/**
 * Répartit un paiement (acompte, solde) entre les lignes au prorata de leur montant, par la
 * méthode du plus fort reste : la somme des parts égale exactement le paiement.
 */
export const allocateAmount = (payment: number, lines: readonly Share[]): Share[] => {
  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  if (total <= 0) return lines.map((line) => ({ lineId: line.lineId, amount: 0 }));
  const raw = lines.map((line, index) => {
    const exact = payment * line.amount;
    return {
      index,
      lineId: line.lineId,
      amount: Math.floor(exact / total),
      remainder: exact % total,
    };
  });
  let missing = payment - raw.reduce((sum, share) => sum + share.amount, 0);
  const byRemainder = [...raw].sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (const share of byRemainder) {
    if (missing <= 0) break;
    share.amount += 1;
    missing -= 1;
  }
  return raw.map(({ lineId, amount }) => ({ lineId, amount }));
};
