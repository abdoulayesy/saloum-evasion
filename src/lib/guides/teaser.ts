import type { Locale } from '@/i18n/routing';
import { publishedIn } from './related';

// Encart « À lire dans les Carnets du Saloum » d'une fiche (004, FR-011, research R8). Pur :
// guides publiés dans la langue, par priorité croissante (100 par défaut) puis mise à jour de
// fond la plus récente, au plus trois.

export const MAX_TEASER_GUIDES = 3;

const DEFAULT_PRIORITY = 100;

type TeaserCandidate = {
  id: number;
  priority?: number | null;
  updatedOn?: string | null;
  _status?: string | null;
  localeStatus?: unknown;
};

export const pickTeaserGuides = <T extends TeaserCandidate>(
  guides: readonly T[],
  locale: Locale,
  limit = MAX_TEASER_GUIDES,
): T[] =>
  guides
    .filter((guide) => publishedIn(guide, locale))
    .toSorted(
      (a, b) =>
        (a.priority ?? DEFAULT_PRIORITY) - (b.priority ?? DEFAULT_PRIORITY) ||
        (b.updatedOn ?? '').localeCompare(a.updatedOn ?? ''),
    )
    .slice(0, limit);
