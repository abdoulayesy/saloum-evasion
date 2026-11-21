import { BlocksFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical';
import type { CollectionConfig, CollectionSlug, Field } from 'payload';
import { PracticalBox } from '@/blocks/PracticalBox';
import { heroImageField } from '@/fields/common';
import { hasText, localeStatusField, seoComplete } from '@/fields/localeStatus';
import { requiredInFrench } from '@/fields/localized';
import { seoField } from '@/fields/seo';
import { countWords } from '@/fields/validators';
import { guideDatesHook } from '@/hooks/guideDates';
import { guideGuardsHook } from '@/hooks/guideGuards';
import { previewFor } from '@/lib/cms/preview';
import { isReviewDue } from '@/lib/guides/dates';
import { contentDefaults } from './shared';

// Guides des « Carnets du Saloum » (004, data-model) : articles pratiques signés par un membre
// de l'équipe, liés aux offres et aux destinations. Brouillons, version anglaise publiée
// seulement si complète, garde-fous médias, redirections et revalidation (contentDefaults).
// La requête cible est `seo.targetKeyword` (registre src/lib/seo/keywords.ts).

const relatedField = (name: string, relationTo: CollectionSlug, label: string): Field => ({
  name,
  type: 'relationship',
  relationTo,
  hasMany: true,
  label,
  admin: { description: 'Dans l’ordre d’affichage.' },
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const today = (): string => new Date().toISOString().slice(0, 10);

export const Guides: CollectionConfig = {
  slug: 'guides',
  labels: { singular: 'Guide', plural: 'Guides (Carnets du Saloum)' },
  admin: {
    useAsTitle: 'title',
    group: 'Carnets du Saloum',
    defaultColumns: ['title', 'theme', 'author', 'updatedOn', 'reviewDue', '_status'],
    // Aperçu d'un brouillon dans la langue éditée (FR-014).
    preview: previewFor('guides'),
    description:
      'Brouillons importés par « pnpm seed:guides » : à relire, signer et publier par un membre de l’équipe. Requête cible : onglet SEO.',
  },
  ...contentDefaults({
    englishCheck: (data) =>
      hasText(data.title) &&
      hasText(data.standfirst) &&
      countWords(data.body) > 0 &&
      seoComplete(data) &&
      isRecord(data.seo) &&
      hasText(data.seo.targetKeyword),
    // Garde-fous avant les dates : ils lisent « Mise à jour importante » avant sa remise à zéro.
    extraBeforeChange: [guideGuardsHook, guideDatesHook],
  }),
  fields: [
    {
      name: 'warnings',
      type: 'ui',
      admin: {
        components: { Field: '/components/admin/GuideWarnings#GuideWarnings' },
      },
    },
    {
      name: 'title',
      type: 'text',
      localized: true,
      label: 'Titre (H1)',
      validate: requiredInFrench(() => true, 'Titre'),
    },
    {
      name: 'standfirst',
      type: 'textarea',
      localized: true,
      label: 'Chapeau',
      admin: { description: 'De 140 à 300 caractères conseillés.' },
      validate: requiredInFrench(() => true, 'Chapeau'),
    },
    heroImageField,
    {
      type: 'row',
      fields: [
        {
          name: 'theme',
          type: 'relationship',
          relationTo: 'guideThemes',
          required: true,
          label: 'Thème',
        },
        {
          name: 'priority',
          type: 'number',
          defaultValue: 100,
          label: 'Priorité dans les encarts',
          admin: { description: 'Plus petit = affiché d’abord sur les fiches liées.' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'author',
          type: 'relationship',
          relationTo: 'teamMembers',
          required: true,
          label: 'Auteur',
        },
        {
          name: 'reviewer',
          type: 'relationship',
          relationTo: 'teamMembers',
          label: 'Relecteur',
        },
      ],
    },
    {
      name: 'requiresCommunityReview',
      type: 'checkbox',
      defaultValue: false,
      label: 'Relecture communautaire obligatoire',
      admin: {
        description:
          'Sujet culturel sensible (ex. culture sérère) : un relecteur issu de la communauté ou consulté est obligatoire.',
      },
    },
    {
      name: 'body',
      type: 'richText',
      localized: true,
      label: 'Texte du guide',
      admin: {
        description:
          'Intertitres H2 (entrées de la table des matières) et H3. Au moins 600 mots conseillés.',
      },
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures.filter((feature) => feature.key !== 'heading'),
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
          BlocksFeature({ blocks: [PracticalBox] }),
        ],
      }),
      validate: requiredInFrench(
        (value) => (countWords(value) > 0 ? true : 'Texte du guide obligatoire.'),
        'Texte du guide',
      ),
    },
    { name: 'faq', type: 'relationship', relationTo: 'faqItems', hasMany: true, label: 'FAQ' },
    {
      type: 'collapsible',
      label: 'Offres et destinations liées',
      fields: [
        relatedField('relatedStays', 'stays', 'Séjours'),
        relatedField('relatedExperiences', 'experiences', 'Expériences'),
        relatedField('relatedAccommodations', 'accommodations', 'Hébergements'),
        relatedField('relatedDestinations', 'destinations', 'Destinations'),
      ],
    },
    {
      name: 'substantiveUpdate',
      type: 'checkbox',
      defaultValue: false,
      label: 'Mise à jour importante',
      admin: {
        position: 'sidebar',
        description:
          'À cocher pour une mise à jour de fond : la date « Mis à jour le » devient celle du jour. Une correction mineure ne change pas la date.',
      },
    },
    {
      name: 'publishedOn',
      type: 'text',
      label: 'Première publication',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'updatedOn',
      type: 'text',
      label: 'Mis à jour le',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'reviewDue',
      type: 'checkbox',
      virtual: true,
      label: 'À revoir (12 mois)',
      admin: { position: 'sidebar', readOnly: true },
      hooks: {
        afterRead: [
          ({ siblingData }) =>
            isReviewDue(
              typeof siblingData.updatedOn === 'string' ? siblingData.updatedOn : null,
              today(),
            ),
        ],
      },
    },
    {
      name: 'readingMinutes',
      type: 'number',
      localized: true,
      label: 'Temps de lecture (min)',
      admin: { position: 'sidebar', readOnly: true },
    },
    seoField(),
    localeStatusField,
  ],
};
