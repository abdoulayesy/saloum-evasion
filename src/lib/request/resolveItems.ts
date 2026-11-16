import { buildPath } from '@/i18n/pathnames';
import type { Locale } from '@/i18n/routing';
import { accommodationPath } from '@/lib/catalogPaths';
import { getAccommodationBySlug, getExperienceBySlug, getStayBySlug } from '@/lib/cms/queries';
import { experiencePath } from '@/lib/experiencePaths';
import type { RequestItemKind } from './schema';

// Éléments d'une demande résolus côté serveur dans la langue de la page : documents publiés
// uniquement, slugs inconnus ignorés (contrat request-form.md §4, étape 5).

export type ResolvedItem = {
  kind: RequestItemKind;
  slug: string;
  id: number;
  title: string;
  path: string | null;
};

const COLLECTIONS = {
  stay: 'stays',
  experience: 'experiences',
  accommodation: 'accommodations',
} as const satisfies Record<RequestItemKind, string>;

export const collectionOf = (kind: RequestItemKind) => COLLECTIONS[kind];

export const resolveItem = async (
  locale: Locale,
  kind: RequestItemKind,
  slug: string,
): Promise<ResolvedItem | null> => {
  if (kind === 'stay') {
    const stay = await getStayBySlug(locale, slug);
    return stay
      ? {
          kind,
          slug,
          id: stay.id,
          title: stay.title ?? slug,
          path: buildPath(locale, { type: 'stay', slug }),
        }
      : null;
  }
  if (kind === 'experience') {
    const experience = await getExperienceBySlug(locale, slug);
    return experience
      ? {
          kind,
          slug,
          id: experience.id,
          title: experience.title ?? slug,
          path: experiencePath(locale, experience),
        }
      : null;
  }
  const accommodation = await getAccommodationBySlug(locale, slug);
  return accommodation
    ? {
        kind,
        slug,
        id: accommodation.id,
        title: accommodation.title ?? slug,
        path: accommodationPath(locale, accommodation),
      }
    : null;
};

export const resolveItems = async (
  locale: Locale,
  items: readonly { kind: RequestItemKind; slug: string }[],
): Promise<ResolvedItem[]> => {
  const resolved = await Promise.all(
    items.map((item) => resolveItem(locale, item.kind, item.slug)),
  );
  return resolved.filter((item): item is ResolvedItem => item !== null);
};
