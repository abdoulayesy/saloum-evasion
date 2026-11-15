import type { MetadataRoute } from 'next';
import { buildPath } from '@/i18n/pathnames';
import { getAlternates, listStays } from '@/lib/cms/queries';
import { populated, populatedList } from '@/lib/cms/populated';
import { entriesForRoute, fixedEntries, isListable } from '@/lib/seo/sitemapEntries';
import { absoluteUrl } from '@/lib/site';
import type { Media, Stay } from '@/payload-types';

// /sitemap.xml (contrat routes.md) : pages fixes livrées + fiches publiées, une entrée par
// langue publiée avec hreflang, `lastModified` réel et images (principale + galerie).
// Régénéré à chaque publication (tags des collections invalidés par hooks/revalidate.ts).

const imagesOf = (stay: Stay): string[] =>
  [populated<Media>(stay.heroImage), ...populatedList<Media>(stay.gallery)]
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

const sitemap = async (): Promise<MetadataRoute.Sitemap> => [
  ...fixedEntries(),
  ...(await stayEntries()),
];

export default sitemap;
