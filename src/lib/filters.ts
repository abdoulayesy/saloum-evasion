import type { BudgetBand, DurationCategory } from './pricing';

// Filtres de la liste des séjours (FR-002, T086) : lecture et écriture des paramètres d'URL
// `duree`, `envie`, `budget`, et application à une liste. Pur, partagé entre le serveur
// (attributs de données des cartes) et l'îlot client du panneau de filtres.

export const DURATIONS = [
  'weekend',
  'short',
  'week',
] as const satisfies readonly DurationCategory[];
export const MOODS = [
  'nature',
  'culture',
  'gastronomie',
  'detente',
  'aventure',
  'famille',
] as const;
export const BUDGETS = ['lt250k', '250k-500k', 'gt500k'] as const satisfies readonly BudgetBand[];

export type Mood = (typeof MOODS)[number];

export type StayFilters = {
  durations: DurationCategory[];
  moods: Mood[];
  budgets: BudgetBand[];
};

export type FilterableStay = {
  durationCategory: DurationCategory | null;
  moods: readonly string[];
  budgetBand: BudgetBand | null;
};

export const EMPTY_FILTERS: StayFilters = { durations: [], moods: [], budgets: [] };

const pick = <T extends string>(allowed: readonly T[], values: readonly string[]): T[] =>
  allowed.filter((value) => values.includes(value));

const splitParam = (params: URLSearchParams, key: string): string[] =>
  params
    .getAll(key)
    .flatMap((value) => value.split(','))
    .map((value) => value.trim());

/** Paramètres d'URL → filtres valides (les valeurs inconnues sont ignorées). */
export const parseFilters = (params: URLSearchParams): StayFilters => ({
  durations: pick(DURATIONS, splitParam(params, 'duree')),
  moods: pick(MOODS, splitParam(params, 'envie')),
  budgets: pick(BUDGETS, splitParam(params, 'budget')),
});

/** Filtres → chaîne de requête stable (ordre canonique), sans « ? » ; vide si aucun filtre. */
export const serializeFilters = (filters: StayFilters, base = new URLSearchParams()): string => {
  const params = new URLSearchParams(base);
  for (const key of ['duree', 'envie', 'budget']) params.delete(key);
  if (filters.durations.length) params.set('duree', pick(DURATIONS, filters.durations).join(','));
  if (filters.moods.length) params.set('envie', pick(MOODS, filters.moods).join(','));
  if (filters.budgets.length) params.set('budget', pick(BUDGETS, filters.budgets).join(','));
  return params.toString();
};

export const isEmptyFilters = (filters: StayFilters): boolean =>
  filters.durations.length + filters.moods.length + filters.budgets.length === 0;

/** Un séjour correspond si chaque groupe actif est satisfait (OU dans un groupe, ET entre groupes). */
export const matchesFilters = (stay: FilterableStay, filters: StayFilters): boolean => {
  const durationOk =
    filters.durations.length === 0 ||
    (stay.durationCategory !== null && filters.durations.includes(stay.durationCategory));
  const moodOk =
    filters.moods.length === 0 || filters.moods.some((mood) => stay.moods.includes(mood));
  const budgetOk =
    filters.budgets.length === 0 ||
    (stay.budgetBand !== null && filters.budgets.includes(stay.budgetBand));
  return durationOk && moodOk && budgetOk;
};

export const applyFilters = <T extends FilterableStay>(
  stays: readonly T[],
  filters: StayFilters,
): T[] => stays.filter((stay) => matchesFilters(stay, filters));

/** Bascule une valeur dans un groupe de filtres. */
export const toggleValue = <T extends string>(values: readonly T[], value: T): T[] =>
  values.includes(value) ? values.filter((item) => item !== value) : [...values, value];

/** Valeur d'attribut → catégorie de durée connue, ou `null`. */
export const toDuration = (value: string | undefined): DurationCategory | null =>
  DURATIONS.find((duration) => duration === value) ?? null;

/** Valeur d'attribut → tranche de budget connue, ou `null`. */
export const toBudget = (value: string | undefined): BudgetBand | null =>
  BUDGETS.find((budget) => budget === value) ?? null;
