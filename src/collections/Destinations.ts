import type { CollectionConfig } from 'payload';
import { previewFor } from '@/lib/cms/preview';
import { bodyField } from '@/fields/body';
import { galleryField, geoField, heroImageField, replacementTargetField } from '@/fields/common';
import { bodyComplete, hasText, localeStatusField, seoComplete } from '@/fields/localeStatus';
import { requiredInFrench } from '@/fields/localized';
import { seoField } from '@/fields/seo';
import { contentDefaults } from './shared';

// Destinations (data-model) : Ndangane, Mar Lodj, Île aux Oiseaux, Joal-Fadiouth, Palmarin,
// Djiffer. `kind` choisit le JSON-LD : village ou île → TouristDestination, réserve →
// TouristAttraction (contrat jsonld.md).
export const Destinations: CollectionConfig = {
  slug: 'destinations',
  labels: { singular: 'Destination', plural: 'Destinations' },
  admin: {
    preview: previewFor('destinations'),
    useAsTitle: 'name',
    group: 'Catalogue',
    defaultColumns: ['name', 'kind', '_status', 'updatedAt'],
  },
  ...contentDefaults({
    englishCheck: (data) =>
      hasText(data.name) && hasText(data.intro) && seoComplete(data) && bodyComplete(data),
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
      defaultValue: 'village',
      label: 'Type de lieu',
      options: [
        { label: 'Village', value: 'village' },
        { label: 'Île', value: 'ile' },
        { label: 'Réserve naturelle', value: 'reserve' },
      ],
    },
    heroImageField,
    galleryField(0),
    {
      name: 'intro',
      type: 'textarea',
      localized: true,
      label: 'Introduction',
      validate: requiredInFrench(() => true, 'Introduction'),
    },
    geoField,
    bodyField,
    seoField(),
    localeStatusField,
    replacementTargetField('destinations'),
  ],
};
