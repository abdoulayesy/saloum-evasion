import type { GroupField, PayloadRequest } from 'payload';
import {
  findDuplicateMeta,
  isSeoCollection,
  type UniqueArgs,
  type UniqueScope,
} from '@/hooks/uniqueMeta';
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
// image de partage, mot-clé cible, noindex. Unicité : hooks/uniqueMeta.ts.

export { SEO_COLLECTIONS } from '@/hooks/uniqueMeta';

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
    const duplicate = await findDuplicateMeta({
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
