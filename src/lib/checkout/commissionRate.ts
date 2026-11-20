import type { OfferType } from './validateCart';

// Taux de commission en vigueur (002, FR-034) : le plus récent dont la date d'effet est passée,
// pour le type d'offre ; repli sur les défauts du data-model si aucun taux n'est saisi. Pur.

export type RateEntry = { offerType: OfferType; rateBp: number; effectiveFrom: string };

export const DEFAULT_RATES_BP: Readonly<Record<OfferType, number>> = {
  transfer: 1000,
  table: 1500,
  accommodation: 1500,
  experience: 2000,
  stay: 2500,
};

export const rateFor = (rates: readonly RateEntry[], offerType: OfferType, today: string): number =>
  rates
    .filter((rate) => rate.offerType === offerType && rate.effectiveFrom <= today)
    .reduce<RateEntry | null>(
      (latest, rate) =>
        latest === null || rate.effectiveFrom > latest.effectiveFrom ? rate : latest,
      null,
    )?.rateBp ?? DEFAULT_RATES_BP[offerType];

const sameRate = (a: RateEntry, b: RateEntry): boolean =>
  a.offerType === b.offerType && a.rateBp === b.rateBp && a.effectiveFrom === b.effectiveFrom;

/**
 * Historique sans effet rétroactif (US5, T096) : un taux déjà entré en vigueur ne se modifie ni
 * ne se supprime, et un nouveau taux prend effet aujourd'hui au plus tôt. Les réservations
 * payées gardent de toute façon leur taux figé (FR-034). Première saisie (historique vide) :
 * libre.
 */
export const rateHistoryErrors = (
  previous: readonly RateEntry[],
  next: readonly RateEntry[],
  today: string,
): string[] => {
  if (previous.length === 0) return [];
  const errors: string[] = [];
  const started = previous.filter((rate) => rate.effectiveFrom <= today);
  if (started.some((rate) => !next.some((candidate) => sameRate(candidate, rate))))
    errors.push('Un taux déjà en vigueur ne peut être ni modifié ni supprimé : ajoutez une ligne.');
  const added = next.filter((rate) => !previous.some((candidate) => sameRate(candidate, rate)));
  if (added.some((rate) => rate.effectiveFrom < today))
    errors.push('Un nouveau taux prend effet aujourd’hui au plus tôt.');
  return errors;
};
