import type { CollectionSlug, GroupField, PayloadRequest, Where } from 'payload';
import { requiredInFrench } from './localized';
import {
  DESCRIPTION_MAX,
  slugify,
  TITLE_MAX,
  validateLength,
  validateSlug,
  type ValidationResult,
} from './validators';

// Groupe `seo` (data-model) : slug par langue, title et description uniques sur le site,
// image de partage, mot-clé cible, noindex.

export const SEO_COLLECTIONS = [
  'stays',
  'experiences',
  'accommodations',
  'destinations',
  'universes',
  'pages',
] as const satisfies readonly CollectionSlug[];

type UniqueScope = 'collection' | 'site';

type UniqueArgs = {
  value: string;
  field: 'slug' | 'metaTitle' | 'metaDescription';
  scope: UniqueScope;
  req: PayloadRequest;
  id?: number | string;
  collectionSlug?: string;
};

const isSeoCollection = (slug: string | undefined): slug is (typeof SEO_COLLECTIONS)[number] =>
  SEO_COLLECTIONS.some((candidate) => candidate === slug);

/** Premier document (autre que celui en cours) qui porte déjà cette valeur, ou `null`. */
const findDuplicate = async ({
  value,
  field,
  scope,
  req,
  id,
  collectionSlug,
}: UniqueArgs): Promise<string | null> => {
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

type SeoValidateOptions = {
  req: PayloadRequest;
  id?: number | string;
  collectionSlug?: string;
  data: Partial<Record<string, unknown>>;
};

type SeoFieldOptions = {
  /** Champs SEO facultatifs pour ce document (ex. univers de séjour sans page publique). */
  skipWhen?: (data: Partial<Record<string, unknown>>) => boolean;
};

const uniqueValidator =
  (
    field: UniqueArgs['field'],
    scope: UniqueScope,
    check: (value: unknown) => ValidationResult,
    label: string,
    options: SeoFieldOptions,
  ) =>
  async (value: unknown, validateOptions: SeoValidateOptions): Promise<ValidationResult> => {
    if (options.skipWhen?.(validateOptions.data)) return true;
    const base = requiredInFrench(check, label)(value, validateOptions);
    if (base !== true || typeof value !== 'string' || value === '') return base;
    if (!isSeoCollection(validateOptions.collectionSlug)) return true;
    const duplicate = await findDuplicate({
      value,
      field,
      scope,
      req: validateOptions.req,
      id: validateOptions.id,
      collectionSlug: validateOptions.collectionSlug,
    });
    return duplicate === null
      ? true
      : `${label} déjà utilisé (${duplicate}) : il doit être unique.`;
  };

const titleSource = (data: Partial<Record<string, unknown>> | undefined): string => {
  const candidate = data?.title ?? data?.name;
  return typeof candidate === 'string' ? candidate : '';
};

export const seoField = (options: SeoFieldOptions = {}): GroupField => ({
  name: 'seo',
  type: 'group',
  label: 'Référencement (SEO)',
  admin: { description: 'Title ≤ 60 caractères et description ≤ 155, uniques sur tout le site.' },
  fields: [
    {
      name: 'slug',
      type: 'text',
      localized: true,
      index: true,
      label: 'Slug (adresse de la page)',
      admin: { description: 'Généré depuis le titre si vide. Ex. week-end-bolong.' },
      hooks: {
        beforeValidate: [
          ({ value, data }) =>
            typeof value === 'string' && value.length > 0 ? value : slugify(titleSource(data)),
        ],
      },
      validate: uniqueValidator('slug', 'collection', validateSlug, 'Slug', options),
    },
    {
      name: 'metaTitle',
      type: 'text',
      localized: true,
      label: 'Titre SEO',
      maxLength: TITLE_MAX,
      validate: uniqueValidator(
        'metaTitle',
        'site',
        validateLength(TITLE_MAX, 'Titre SEO'),
        'Titre SEO',
        options,
      ),
    },
    {
      name: 'metaDescription',
      type: 'textarea',
      localized: true,
      label: 'Description SEO',
      maxLength: DESCRIPTION_MAX,
      validate: uniqueValidator(
        'metaDescription',
        'site',
        validateLength(DESCRIPTION_MAX, 'Description SEO'),
        'Description SEO',
        options,
      ),
    },
    {
      name: 'shareImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Image de partage',
      admin: { description: 'Facultative : l’image principale est utilisée par défaut.' },
    },
    {
      name: 'targetKeyword',
      type: 'text',
      localized: true,
      label: 'Mot-clé cible',
    },
    {
      name: 'noindex',
      type: 'checkbox',
      defaultValue: false,
      label: 'Ne pas indexer (noindex)',
    },
  ],
});
