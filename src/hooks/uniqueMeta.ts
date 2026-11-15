import type { CollectionSlug, PayloadRequest, Where } from 'payload';

// Unicité des métadonnées (T065, constitution III) : `metaTitle` et `metaDescription` uniques
// par langue sur toutes les collections publiques et `pages` ; slug unique par collection et
// par langue. Branché comme validation des champs du groupe `seo` (fields/seo.ts), donc
// appliqué à la publication avec un message clair dans l'admin.

export const SEO_COLLECTIONS = [
  'stays',
  'experiences',
  'accommodations',
  'destinations',
  'universes',
  'pages',
] as const satisfies readonly CollectionSlug[];

export type SeoCollection = (typeof SEO_COLLECTIONS)[number];

export type UniqueScope = 'collection' | 'site';

export type UniqueArgs = {
  value: string;
  field: 'slug' | 'metaTitle' | 'metaDescription';
  scope: UniqueScope;
  req: PayloadRequest;
  id?: number | string;
  collectionSlug?: string;
};

export const isSeoCollection = (slug: string | undefined): slug is SeoCollection =>
  SEO_COLLECTIONS.some((candidate) => candidate === slug);

/** Collection d'un autre document qui porte déjà cette valeur dans la langue courante, ou `null`. */
export const findDuplicateMeta = async ({
  value,
  field,
  scope,
  req,
  id,
  collectionSlug,
}: UniqueArgs): Promise<SeoCollection | null> => {
  const targets =
    scope === 'collection'
      ? SEO_COLLECTIONS.filter((slug) => slug === collectionSlug)
      : SEO_COLLECTIONS;
  for (const collection of targets) {
    const conditions: Where[] = [{ [`seo.${field}`]: { equals: value } }];
    if (collection === collectionSlug && id !== undefined)
      conditions.push({ id: { not_equals: id } });
    const result = await req.payload.find({
      collection,
      where: { and: conditions },
      locale: req.locale ?? 'fr',
      depth: 0,
      limit: 1,
      draft: true,
      overrideAccess: true,
      req,
    });
    if (result.docs.length > 0) return collection;
  }
  return null;
};
