// Tarification d'affichage (constitution VI : montants XOF entiers, conversion dérivée et
// indicative). Parité fixe : 1 € = 655,957 FCFA.

export const XOF_PER_EUR = 655.957;

export type DurationCategory = 'weekend' | 'short' | 'week';
export type BudgetBand = 'lt250k' | '250k-500k' | 'gt500k';

const assertXof = (amount: number): void => {
  if (!Number.isInteger(amount) || amount < 0)
    throw new Error(`Montant XOF invalide : ${amount} (entier positif attendu)`);
};

/** Prix « à partir de » : le plus bas des deux saisons. */
export const priceFrom = (lowSeason: number, highSeason: number): number => {
  assertXof(lowSeason);
  assertXof(highSeason);
  return Math.min(lowSeason, highSeason);
};

export const durationCategory = (nights: number): DurationCategory => {
  if (nights <= 2) return 'weekend';
  if (nights <= 4) return 'short';
  return 'week';
};

export const budgetBand = (amountXof: number): BudgetBand => {
  assertXof(amountXof);
  if (amountXof < 250_000) return 'lt250k';
  if (amountXof <= 500_000) return '250k-500k';
  return 'gt500k';
};

/** Équivalent indicatif en euros, arrondi à l'euro supérieur. */
export const toEurIndicative = (amountXof: number): number => {
  assertXof(amountXof);
  return Math.ceil(amountXof / XOF_PER_EUR);
};

const groupThousands = (value: number): string =>
  String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** « 250 000 FCFA » (espaces fines insécables). */
export const formatXof = (amountXof: number): string => {
  assertXof(amountXof);
  return `${groupThousands(amountXof)} FCFA`;
};

/**
 * Montant signé des écritures comptables (remboursements, ajustements) : « −6 250 FCFA ». Signe
 * moins typographique (U+2212). Réservé à l'admin finance ; le site public n'affiche que des prix.
 */
export const formatSignedXof = (amountXof: number): string =>
  amountXof < 0 ? `−${formatXof(-amountXof)}` : formatXof(amountXof);

/** « ≈ 382 € » (FR) ou « ≈ €382 » (EN). */
export const formatEur = (amountXof: number, locale: 'fr' | 'en' = 'fr'): string => {
  const eur = groupThousands(toEurIndicative(amountXof));
  return locale === 'fr' ? `≈ ${eur} €` : `≈ €${eur.replace(/ /g, ',')}`;
};
