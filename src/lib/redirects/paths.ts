import { buildPath, type Route } from '@/i18n/pathnames';
import type { Locale } from '@/i18n/routing';

// Chemins publics d'un document et de sa page parente, par langue (contrat routes.md).
// Pur : les slugs nécessaires sont fournis par l'appelant.

export type RoutedCollection =
  'stays' | 'experiences' | 'accommodations' | 'destinations' | 'universes';

export const isRoutedCollection = (slug: string): slug is RoutedCollection =>
  ['stays', 'experiences', 'accommodations', 'destinations', 'universes'].includes(slug);

export type PathInput = {
  collection: RoutedCollection;
  locale: Locale;
  slug: string | null | undefined;
  /** Slug de l'univers dans cette langue (expériences seulement). */
  universeSlug?: string | null;
};

const routeFor = ({ collection, slug, universeSlug }: PathInput): Route | null => {
  if (!slug) return null;
  switch (collection) {
    case 'stays':
      return { type: 'stay', slug };
    case 'accommodations':
      return { type: 'accommodation', slug };
    case 'destinations':
      return { type: 'destination', slug };
    case 'universes':
      return { type: 'universe', universe: slug };
    case 'experiences':
      return universeSlug ? { type: 'experience', universe: universeSlug, slug } : null;
    default: {
      const unreachable: never = collection;
      return unreachable;
    }
  }
};

/** Chemin public du document, ou `null` s'il lui manque un slug. */
export const documentPath = (input: PathInput): string | null => {
  const route = routeFor(input);
  return route ? buildPath(input.locale, route) : null;
};

/**
 * Page parente la plus pertinente (spec US3, scénario 5) : la liste de la collection ;
 * pour une expérience, la page de son univers si elle existe, sinon le hub.
 */
export const parentPath = (
  collection: RoutedCollection,
  locale: Locale,
  universeSlug?: string | null,
): string => {
  switch (collection) {
    case 'stays':
      return buildPath(locale, { type: 'staysList' });
    case 'accommodations':
      return buildPath(locale, { type: 'accommodationsList' });
    case 'destinations':
      return buildPath(locale, { type: 'destinationsList' });
    case 'universes':
      return buildPath(locale, { type: 'experiencesHub' });
    case 'experiences':
      return universeSlug
        ? buildPath(locale, { type: 'universe', universe: universeSlug })
        : buildPath(locale, { type: 'experiencesHub' });
    default: {
      const unreachable: never = collection;
      return unreachable;
    }
  }
};
