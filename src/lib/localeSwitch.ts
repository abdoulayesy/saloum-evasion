import { buildPath, resolvePath, type Route } from '@/i18n/pathnames';
import { isLocale, type Locale } from '@/i18n/routing';
import { accommodationAlternates, destinationAlternates } from '@/lib/catalogPaths';
import { checkoutPath, parseCheckoutPath } from '@/lib/checkout/paths';
import {
  getAccommodationBySlug,
  getAlternates,
  getDestinationBySlug,
  getExperienceBySlug,
  getStayBySlug,
  getUniverseBySlug,
} from '@/lib/cms/queries';
import { experienceAlternates, universeAlternates } from '@/lib/experiencePaths';

// Bascule de langue sur la même page (T156, US5) : à partir du chemin d'une page, chemin de la
// page équivalente dans l'autre langue, calculé côté serveur depuis les slugs traduits du CMS.
// Sans version publiée dans la langue demandée : page parente, signalée par `missing`.

export type LocaleTarget = { path: string; missing: boolean };

/** Parent d'une page de contenu, pour le repli quand la traduction manque. */
export const parentRoute = (route: Route): Route => {
  switch (route.type) {
    case 'stay':
      return { type: 'staysList' };
    case 'experience':
    case 'universe':
      return { type: 'experiencesHub' };
    case 'destination':
      return { type: 'destinationsList' };
    case 'accommodation':
      return { type: 'accommodationsList' };
    default:
      return { type: 'home' };
  }
};

/** Chemins FR/EN d'une page de contenu, ou `null` si le document est introuvable. */
const contentAlternates = async (
  locale: Locale,
  route: Route,
): Promise<Partial<Record<Locale, string>> | null> => {
  switch (route.type) {
    case 'stay': {
      const stay = await getStayBySlug(locale, route.slug);
      if (!stay) return null;
      const slugs = await getAlternates('stays', stay.id);
      return {
        ...(slugs.fr ? { fr: buildPath('fr', { type: 'stay', slug: slugs.fr }) } : {}),
        ...(slugs.en ? { en: buildPath('en', { type: 'stay', slug: slugs.en }) } : {}),
      };
    }
    case 'experience': {
      const experience = await getExperienceBySlug(locale, route.slug);
      return experience ? experienceAlternates(experience) : null;
    }
    case 'universe': {
      const universe = await getUniverseBySlug(locale, route.universe);
      return universe ? universeAlternates(universe.id) : null;
    }
    case 'destination': {
      const destination = await getDestinationBySlug(locale, route.slug);
      return destination ? destinationAlternates(destination.id) : null;
    }
    case 'accommodation': {
      const accommodation = await getAccommodationBySlug(locale, route.slug);
      return accommodation ? accommodationAlternates(accommodation.id) : null;
    }
    default:
      return null;
  }
};

const isContentRoute = (route: Route): boolean =>
  ['stay', 'experience', 'universe', 'destination', 'accommodation'].includes(route.type);

/** Page équivalente de `fromPath` dans la langue `to`. */
export const localeTarget = async (fromPath: string, to: Locale): Promise<LocaleTarget> => {
  const home: LocaleTarget = { path: buildPath(to, { type: 'home' }), missing: false };
  // Tunnel de commande (002) : même étape dans l'autre langue, panier conservé (cookie).
  const checkout = parseCheckoutPath(fromPath.split('?')[0] ?? '');
  if (checkout)
    return { path: checkoutPath(to, checkout.route.step, checkout.route.ref), missing: false };
  const [, fromLocale = '', ...segments] = fromPath.split('?')[0]?.split('/') ?? [];
  if (!isLocale(fromLocale)) return home;
  const route = resolvePath(fromLocale, segments.filter(Boolean));
  if (!route) return home;
  if (!isContentRoute(route)) return { path: buildPath(to, route), missing: false };
  const alternates = await contentAlternates(fromLocale, route);
  const target = alternates?.[to];
  return target
    ? { path: target, missing: false }
    : { path: buildPath(to, parentRoute(route)), missing: true };
};
