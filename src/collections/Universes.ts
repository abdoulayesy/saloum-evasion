import type { CollectionConfig } from 'payload';
import { hasText, localeStatusField, seoComplete } from '@/fields/localeStatus';
import { requiredInFrench } from '@/fields/localized';
import { seoField } from '@/fields/seo';
import { contentDefaults } from './shared';

const isStayUniverse = (data: Partial<Record<string, unknown>>): boolean => data.kind === 'stay';

// Univers (data-model) : Mangrove & îles, Terre & villages, Table du Saloum (`experience`,
// page publique) ; Séjours & hébergements (`stay`, porte d'entrée de l'accueil, sans page).
export const Universes: CollectionConfig = {
  slug: 'universes',
  labels: { singular: 'Univers', plural: 'Univers' },
  admin: { useAsTitle: 'name', group: 'Catalogue', defaultColumns: ['name', 'kind', 'order'] },
  ...contentDefaults({
    englishCheck: (data) =>
      hasText(data.name) && hasText(data.intro) && (isStayUniverse(data) || seoComplete(data)),
  }),
  fields: [
    {
      name: 'name',
      type: 'text',
      localized: true,
      label: 'Nom',
      validate: requiredInFrench(() => true, 'Nom'),
    },
    {
      name: 'kind',
      type: 'select',
      required: true,
      defaultValue: 'experience',
      label: 'Type',
      options: [
        { label: 'Univers d’expériences (page publique)', value: 'experience' },
        { label: 'Séjours & hébergements (accueil seulement)', value: 'stay' },
      ],
    },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Image' },
    {
      name: 'intro',
      type: 'textarea',
      localized: true,
      label: 'Introduction',
      validate: requiredInFrench(() => true, 'Introduction'),
    },
    { name: 'order', type: 'number', defaultValue: 0, label: 'Ordre d’affichage' },
    {
      ...seoField({ skipWhen: isStayUniverse }),
      admin: { condition: (data) => data.kind !== 'stay' },
    },
    localeStatusField,
  ],
};
