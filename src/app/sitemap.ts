import type { MetadataRoute } from 'next';
import { buildPath } from '@/i18n/pathnames';
import {
  getAlternates,
  listAccommodations,
  listDestinations,
  listExperiences,
  listStays,
  listUniverses,
  listVideos,
} from '@/lib/cms/queries';
import { accommodationAlternates, destinationAlternates } from '@/lib/catalogPaths';
import { populated, populatedList } from '@/lib/cms/populated';
import { experienceAlternates, universeAlternates } from '@/lib/experiencePaths';
import { mp4Url, thumbnailUrl } from '@/lib/mux';
import {
  entriesForRoute,
  fixedEntries,
  isListable,
  type SitemapVideo,
} from '@/lib/seo/sitemapEntries';
import { absoluteUrl } from '@/lib/site';
import type { Media } from '@/payload-types';

// /sitemap.xml (contrat routes.md) : pages fixes livrées + fiches publiées, une entrée par
// langue publiée avec hreflang, `lastModified` réel et images (principale + galerie).
// Rendu à la demande : toujours à jour après une publication. Les lectures passent par le
// cache de données (tags invalidés par hooks/revalidate.ts), la génération reste légère.
export const dynamic = 'force-dynamic';

type WithImages = {
  heroImage?: number | Media | null;
  image?: number | Media | null;
  gallery?: (number | Media)[] | null;
};

const imagesOf = (doc: WithImages): string[] =>
  [
    populated<Media>(doc.heroImage),
    populated<Media>(doc.image),
    ...populatedList<Media>(doc.gallery),
  ]
    .flatMap((media) => (media?.url ? [media.url] : []))
    .map((url) => (url.startsWith('http') ? url : absoluteUrl(url)));

const stayEntries = async (): Promise<MetadataRoute.Sitemap> => {
  if (!isListable('stay')) return [];
  const stays = (await listStays('fr')).filter((stay) => !stay.seo?.noindex);
  const entries = await Promise.all(
    stays.map(async (stay) => {
      const slugs = await getAlternates('stays', stay.id);
      return entriesForRoute(
        {
          ...(slugs.fr ? { fr: buildPath('fr', { type: 'stay', slug: slugs.fr }) } : {}),
          ...(slugs.en ? { en: buildPath('en', { type: 'stay', slug: slugs.en }) } : {}),
        },
        { lastModified: new Date(stay.updatedAt), images: imagesOf(stay) },
      );
    }),
  );
  return entries.flat();
};

const experienceEntries = async (): Promise<MetadataRoute.Sitemap> => {
  if (!isListable('experience')) return [];
  const experiences = (await listExperiences('fr')).filter((item) => !item.seo?.noindex);
  const entries = await Promise.all(
    experiences.map(async (experience) =>
      entriesForRoute(await experienceAlternates(experience), {
        lastModified: new Date(experience.updatedAt),
        images: imagesOf(experience),
      }),
    ),
  );
  return entries.flat();
};

const universeEntries = async (): Promise<MetadataRoute.Sitemap> => {
  if (!isListable('universe')) return [];
  const universes = (await listUniverses('fr')).filter(
    (universe) => universe.kind === 'experience' && !universe.seo?.noindex,
  );
  const entries = await Promise.all(
    universes.map(async (universe) =>
      entriesForRoute(await universeAlternates(universe.id), {
        lastModified: new Date(universe.updatedAt),
        images: imagesOf(universe),
      }),
    ),
  );
  return entries.flat();
};

const destinationEntries = async (): Promise<MetadataRoute.Sitemap> => {
  if (!isListable('destination')) return [];
  const destinations = (await listDestinations('fr')).filter((item) => !item.seo?.noindex);
  const entries = await Promise.all(
    destinations.map(async (destination) =>
      entriesForRoute(await destinationAlternates(destination.id), {
        lastModified: new Date(destination.updatedAt),
        images: imagesOf(destination),
      }),
    ),
  );
  return entries.flat();
};

const accommodationEntries = async (): Promise<MetadataRoute.Sitemap> => {
  if (!isListable('accommodation')) return [];
  const accommodations = (await listAccommodations('fr')).filter((item) => !item.seo?.noindex);
  const entries = await Promise.all(
    accommodations.map(async (accommodation) =>
      entriesForRoute(await accommodationAlternates(accommodation.id), {
        lastModified: new Date(accommodation.updatedAt),
        images: imagesOf(accommodation),
      }),
    ),
  );
  return entries.flat();
};

/** Page film : une entrée par langue avec ses balises vidéo (film puis verticales). */
const filmEntries = async (): Promise<MetadataRoute.Sitemap> => {
  if (!isListable('film')) return [];
  const paths = { fr: buildPath('fr', { type: 'film' }), en: buildPath('en', { type: 'film' }) };
  const perLocale = await Promise.all(
    (['fr', 'en'] as const).map(async (locale) => {
      const videos = [
        ...(await listVideos(locale, 'film')),
        ...(await listVideos(locale, 'vertical15')),
      ];
      const items: SitemapVideo[] = videos.map((video) => ({
        title: video.title ?? '',
        description: video.description ?? '',
        thumbnail_loc: thumbnailUrl(video.muxPlaybackId),
        content_loc: mp4Url(video.muxPlaybackId),
        duration: video.durationSeconds,
        publication_date: video.uploadDate,
      }));
      const updatedAt = Math.max(0, ...videos.map((video) => new Date(video.updatedAt).getTime()));
      return entriesForRoute(paths, {
        videos: items,
        ...(updatedAt > 0 ? { lastModified: new Date(updatedAt) } : {}),
      }).filter((entry) => entry.url === absoluteUrl(paths[locale]));
    }),
  );
  return perLocale.flat();
};

const sitemap = async (): Promise<MetadataRoute.Sitemap> => [
  ...fixedEntries(),
  ...(await filmEntries()),
  ...(await stayEntries()),
  ...(await universeEntries()),
  ...(await experienceEntries()),
  ...(await destinationEntries()),
  ...(await accommodationEntries()),
];

export default sitemap;
