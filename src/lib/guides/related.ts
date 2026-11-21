import type { Locale } from '@/i18n/routing';

// Offres et destinations liées à un guide (004, FR-010, FR-012). Pur : ne garde que les
// documents peuplés et publiés dans la langue affichée, dans l'ordre saisi par l'équipe.

type Publishable = { id: number; _status?: string | null; localeStatus?: unknown };

export type RelatedKind = 'stay' | 'experience' | 'accommodation' | 'destination';

const isPublishable = (value: unknown): value is Publishable =>
  typeof value === 'object' && value !== null && 'id' in value && typeof value.id === 'number';

const enPublished = (status: unknown): boolean =>
  typeof status === 'object' &&
  status !== null &&
  'enPublished' in status &&
  status.enPublished === true;

/** Document publié et, en anglais, à version anglaise complète. */
export const publishedIn = (value: unknown, locale: Locale): boolean =>
  isPublishable(value) &&
  value._status === 'published' &&
  (locale === 'fr' || enPublished(value.localeStatus));

type Relations<S, E, A, D> = {
  relatedStays?: readonly (number | S)[] | null;
  relatedExperiences?: readonly (number | E)[] | null;
  relatedAccommodations?: readonly (number | A)[] | null;
  relatedDestinations?: readonly (number | D)[] | null;
};

export type RelatedOffer<S, E, A, D> =
  | { kind: 'stay'; doc: S }
  | { kind: 'experience'; doc: E }
  | { kind: 'accommodation'; doc: A }
  | { kind: 'destination'; doc: D };

const keep = <T>(values: readonly (number | T)[] | null | undefined, locale: Locale): T[] =>
  (values ?? []).filter((value): value is T => publishedIn(value, locale));

export const relatedOffers = <
  S extends Publishable,
  E extends Publishable,
  A extends Publishable,
  D extends Publishable,
>(
  guide: Relations<S, E, A, D>,
  locale: Locale,
): RelatedOffer<S, E, A, D>[] => [
  ...keep(guide.relatedStays, locale).map((doc) => ({ kind: 'stay' as const, doc })),
  ...keep(guide.relatedExperiences, locale).map((doc) => ({ kind: 'experience' as const, doc })),
  ...keep(guide.relatedAccommodations, locale).map((doc) => ({
    kind: 'accommodation' as const,
    doc,
  })),
  ...keep(guide.relatedDestinations, locale).map((doc) => ({ kind: 'destination' as const, doc })),
];
