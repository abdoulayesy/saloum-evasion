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
