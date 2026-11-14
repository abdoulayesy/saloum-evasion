import config from '@payload-config';
import { unstable_cache } from 'next/cache';
import { getPayload, type DataFromCollectionSlug, type Where } from 'payload';
import type { PageKey } from '@/collections/Pages';
import { docTag } from '@/hooks/revalidate';
import type { Locale } from '@/i18n/routing';
import type { SiteSetting } from '@/payload-types';

// Lectures publiques du CMS (tâche T060) : documents publiés seulement (aucun brouillon,
// jamais d'accès privilégié), mises en cache avec les tags invalidés par
// hooks/revalidate.ts. Une version anglaise n'est servie que si `localeStatus.enPublished`
// est vrai (constitution « Bilinguisme » : pas de repli silencieux).

export const getPayloadClient = () => getPayload({ config });

type PublicCollection = 'stays' | 'experiences' | 'accommodations' | 'destinations' | 'pages';

const publishedWhere = (locale: Locale, extra: Where[] = []): Where => ({
  and: [
    { _status: { equals: 'published' } },
    ...(locale === 'en' ? [{ 'localeStatus.enPublished': { equals: true } }] : []),
    ...extra,
  ],
});

const DEFAULT_DEPTH = 2;

const findOne = async <TSlug extends PublicCollection>(
  collection: TSlug,
  locale: Locale,
  where: Where[],
): Promise<DataFromCollectionSlug<TSlug> | null> => {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection,
    locale,
    fallbackLocale: false,
    where: publishedWhere(locale, where),
    depth: DEFAULT_DEPTH,
    limit: 1,
    draft: false,
    overrideAccess: false,
  });
  return result.docs[0] ?? null;
};

const findMany = async <TSlug extends PublicCollection>(
  collection: TSlug,
  locale: Locale,
  where: Where[] = [],
  sort = '-updatedAt',
): Promise<DataFromCollectionSlug<TSlug>[]> => {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection,
    locale,
    fallbackLocale: false,
    where: publishedWhere(locale, where),
    depth: DEFAULT_DEPTH,
    limit: 200,
    sort,
    draft: false,
    overrideAccess: false,
  });
  return result.docs;
};

const cached = <Args extends readonly (string | number)[], R>(
  name: string,
  tags: (...args: NoInfer<Args>) => string[],
  fn: (...args: Args) => Promise<R>,
) => {
  return (...args: Args): Promise<R> =>
    unstable_cache(() => fn(...args), [name, ...args.map(String)], { tags: tags(...args) })();
};

const bySlug = (slug: string): Where[] => [{ 'seo.slug': { equals: slug } }];

// --- Séjours -----------------------------------------------------------------------------

export const getStayBySlug = cached(
  'stay-by-slug',
  () => ['stays'],
  (locale: Locale, slug: string) => findOne('stays', locale, bySlug(slug)),
);

export const listStays = cached(
  'list-stays',
  () => ['stays'],
  (locale: Locale) => findMany('stays', locale, [], '-featured'),
);

// --- Expériences ---------------------------------------------------------------------------

export const getExperienceBySlug = cached(
  'experience-by-slug',
  () => ['experiences'],
  (locale: Locale, slug: string) => findOne('experiences', locale, bySlug(slug)),
);

export const listExperiences = cached(
  'list-experiences',
  () => ['experiences'],
  (locale: Locale) => findMany('experiences', locale),
);

// --- Destinations --------------------------------------------------------------------------

export const getDestinationBySlug = cached(
  'destination-by-slug',
  () => ['destinations'],
  (locale: Locale, slug: string) => findOne('destinations', locale, bySlug(slug)),
);

export const listDestinations = cached(
  'list-destinations',
  () => ['destinations'],
  (locale: Locale) => findMany('destinations', locale, [], 'name'),
);

// --- Hébergements --------------------------------------------------------------------------

export const getAccommodationBySlug = cached(
  'accommodation-by-slug',
  () => ['accommodations'],
  (locale: Locale, slug: string) => findOne('accommodations', locale, bySlug(slug)),
);

export const listAccommodations = cached(
  'list-accommodations',
  () => ['accommodations'],
  (locale: Locale) => findMany('accommodations', locale),
);

// --- Pages éditoriales ---------------------------------------------------------------------

export const getPage = cached(
  'page-by-key',
  () => ['pages'],
  (locale: Locale, key: PageKey) => findOne('pages', locale, [{ key: { equals: key } }]),
);

// --- Réglages du site ----------------------------------------------------------------------

export const getSiteSettingsGlobal = cached(
  'site-settings',
  () => ['global:siteSettings'],
  async (locale: Locale): Promise<SiteSetting> => {
    const payload = await getPayloadClient();
    return payload.findGlobal({ slug: 'siteSettings', locale, depth: 0, overrideAccess: false });
  },
);

// --- Versions linguistiques ----------------------------------------------------------------

type Alternates = Partial<Record<Locale, string>>;

/**
 * Slugs d'un document dans chaque langue publiée (hreflang, sélecteur de langue).
 * La version anglaise n'apparaît que si elle est complète et publiée.
 */
export const getAlternates = cached(
  'alternates',
  (collection: PublicCollection, id: number | string) => [docTag(collection, id), collection],
  async (collection: PublicCollection, id: number | string): Promise<Alternates> => {
    const payload = await getPayloadClient();
    const doc = await payload.findByID({
      collection,
      id,
      locale: 'all',
      depth: 0,
      draft: false,
      overrideAccess: false,
    });
    const record: unknown = doc;
    if (typeof record !== 'object' || record === null) return {};
    const seo = 'seo' in record && typeof record.seo === 'object' ? record.seo : null;
    const slug = seo !== null && 'slug' in seo ? seo.slug : null;
    const status = 'localeStatus' in record ? record.localeStatus : null;
    const enPublished =
      typeof status === 'object' && status !== null && 'enPublished' in status
        ? status.enPublished === true
        : false;
    const slugIn = (locale: Locale): string | undefined => {
      if (typeof slug !== 'object' || slug === null || !(locale in slug)) return undefined;
      const value: unknown = Reflect.get(slug, locale);
      return typeof value === 'string' && value !== '' ? value : undefined;
    };
    const alternates: Alternates = {};
    const fr = slugIn('fr');
    if (fr) alternates.fr = fr;
    const en = slugIn('en');
    if (en && enPublished) alternates.en = en;
    return alternates;
  },
);

/** Tag d'un document, réexporté pour les pages qui l'utilisent dans `generateStaticParams`. */
export { docTag };
