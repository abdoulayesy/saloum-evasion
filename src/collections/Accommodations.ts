import type { CollectionConfig } from 'payload';
import { previewFor } from '@/lib/cms/preview';
import { bodyField } from '@/fields/body';
import {
  galleryField,
  geoField,
  heroImageField,
  replacementTargetField,
  summaryField,
  titleField,
  xofField,
} from '@/fields/common';
import { bodyComplete, hasText, localeStatusField, seoComplete } from '@/fields/localeStatus';
import { requiredInFrench } from '@/fields/localized';
import { seoField } from '@/fields/seo';
import { contentDefaults } from './shared';

// Hébergements (data-model) : villa, écolodge ou campement ; galerie d'au moins 5 photos ;
// coordonnées GPS pour le JSON-LD (aucune carte interactive) ; identifiant de location
// facultatif (balisage VacationRental).
export const Accommodations: CollectionConfig = {
  slug: 'accommodations',
  labels: { singular: 'Hébergement', plural: 'Hébergements' },
  admin: {
    preview: previewFor('accommodations'),
    useAsTitle: 'title',
    group: 'Catalogue',
    defaultColumns: ['title', 'type', 'capacity', '_status', 'updatedAt'],
  },
  ...contentDefaults({
    englishCheck: (data) =>
      hasText(data.title) &&
      hasText(data.summary) &&
      hasText(data.address) &&
      seoComplete(data) &&
      bodyComplete(data),
  }),
  fields: [
    titleField(),
    summaryField,
    heroImageField,
    galleryField(5),
    {
      type: 'row',
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          label: 'Type',
          options: [
            { label: 'Villa', value: 'villa' },
            { label: 'Écolodge', value: 'ecolodge' },
            { label: 'Campement', value: 'campement' },
          ],
        },
        { name: 'capacity', type: 'number', required: true, min: 1, label: 'Capacité (personnes)' },
        { name: 'bedrooms', type: 'number', min: 0, label: 'Chambres' },
      ],
    },
    {
      name: 'amenities',
      type: 'select',
      hasMany: true,
      label: 'Équipements',
      options: [
        { label: 'Piscine', value: 'piscine' },
        { label: 'Climatisation', value: 'climatisation' },
        { label: 'Wi-Fi', value: 'wifi' },
        { label: 'Vue sur le bolong', value: 'vue-bolong' },
        { label: 'Accès plage', value: 'acces-plage' },
        { label: 'Cuisine', value: 'cuisine' },
        { label: 'Parking', value: 'parking' },
        { label: 'Accessible PMR', value: 'pmr' },
      ],
    },
    xofField('priceFromPerNight', 'Prix à partir de, par nuit'),
    {
      name: 'destination',
      type: 'relationship',
      relationTo: 'destinations',
      required: true,
      label: 'Destination',
    },
    geoField,
    {
      name: 'address',
      type: 'text',
      localized: true,
      label: 'Adresse ou localité affichable',
      validate: requiredInFrench(() => true, 'Adresse'),
    },
    {
      name: 'identifier',
      type: 'text',
      label: 'Identifiant de location',
      admin: {
        description: 'Facultatif ; requis pour le balisage VacationRental (avec 8 photos ou plus).',
      },
    },
    bodyField,
    seoField(),
    localeStatusField,
    replacementTargetField('accommodations'),
  ],
};
