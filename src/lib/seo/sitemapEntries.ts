import type { MetadataRoute } from 'next';
import { buildPath, type Route, type RouteType } from '@/i18n/pathnames';
import { routing, type Locale } from '@/i18n/routing';
import { isTunnelPath } from '@/lib/checkout/paths';
import { isLive } from '@/lib/navigation';
import { absoluteUrl } from '@/lib/site';

// Entrées du sitemap (contrat routes.md « Sitemap ») : une entrée par page indexable et par
// langue publiée, avec hreflang (`alternates.languages`). Les documents du CMS (fiches,
// images, vidéos) s'ajoutent en phase 2B via `documentEntries`.

type SitemapEntry = MetadataRoute.Sitemap[number];
export type SitemapVideo = NonNullable<SitemapEntry['videos']>[number];

/** Pages jamais listées : noindex (constitution III, contrat routes.md). */
const NOINDEX_TYPES: ReadonlySet<RouteType> = new Set<RouteType>([
  'legal',
  'request',
  'requestThanks',
]);

type FixedRoute = Exclude<
  Route,
  { type: 'stay' | 'universe' | 'experience' | 'accommodation' | 'destination' }
>;

const FIXED_ROUTES: readonly FixedRoute[] = [
  { type: 'home' },
  { type: 'staysList' },
  { type: 'experiencesHub' },
  { type: 'accommodationsList' },
  { type: 'destinationsList' },
  { type: 'film' },
  { type: 'commitment' },
  { type: 'about' },
  { type: 'faq' },
  { type: 'contact' },
  { type: 'privacy' },
  { type: 'legal' },
  { type: 'request' },
  { type: 'requestThanks' },
];

export const isListable = (type: RouteType): boolean => isLive(type) && !NOINDEX_TYPES.has(type);

/** Une entrée par langue pour une route présente dans les langues `locales`. */
export const entriesForRoute = (
  paths: Partial<Record<Locale, string>>,
  options: {
    lastModified?: Date;
    priority?: number;
    images?: string[];
    videos?: SitemapVideo[];
  } = {},
): SitemapEntry[] => {
  // Tunnel de commande (002, T035) : jamais dans le sitemap, quelle que soit l'origine du chemin.
  if (Object.values(paths).some((path) => path !== undefined && isTunnelPath(path))) return [];
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    const path = paths[locale];
    if (path !== undefined) languages[locale] = absoluteUrl(path);
  }
  if (paths.fr !== undefined) languages['x-default'] = absoluteUrl(paths.fr);

  return routing.locales.flatMap((locale) => {
    const path = paths[locale];
    if (path === undefined) return [];
    return [
      {
        url: absoluteUrl(path),
        alternates: { languages },
        ...(options.lastModified ? { lastModified: options.lastModified } : {}),
        ...(options.priority !== undefined ? { priority: options.priority } : {}),
        ...(options.images && options.images.length > 0 ? { images: options.images } : {}),
        ...(options.videos && options.videos.length > 0 ? { videos: options.videos } : {}),
      },
    ];
  });
};

/** Pages fixes ; la page film a ses propres entrées (balises vidéo) dans app/sitemap.ts. */
export const fixedEntries = (): SitemapEntry[] =>
  FIXED_ROUTES.filter((route) => isListable(route.type) && route.type !== 'film').flatMap((route) =>
    entriesForRoute(
      { fr: buildPath('fr', route), en: buildPath('en', route) },
      route.type === 'home' ? { priority: 1 } : {},
    ),
  );
