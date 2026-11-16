import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload';
import { bookableFields, bookableGuard, groupValue, isWholeXof } from '@/fields/bookable';
import { integerField } from '@/fields/checkout';
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

const hasNightPrices = (data: Record<string, unknown>): boolean => {
  const pricing = groupValue(data, 'pricing');
  return isWholeXof(pricing.lowSeasonPerNight) && isWholeXof(pricing.highSeasonPerNight);
};

/** « À partir de » calculé : le plus bas des deux prix saisonniers (002, T020). */
export const computePriceFrom: CollectionBeforeValidateHook = ({ data }) => {
  if (!data) return data;
  const pricing = groupValue(data, 'pricing');
  const { lowSeasonPerNight: low, highSeasonPerNight: high } = pricing;
  if (isWholeXof(low) && isWholeXof(high))
    return { ...data, priceFromPerNight: Math.min(low, high) };
  return data;
};

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
    beforeValidate: [computePriceFrom],
    extraBeforeChange: [bookableGuard(hasNightPrices)],
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
    {
      name: 'pricing',
      type: 'group',
      label: 'Prix TTC par nuit (logement entier)',
      fields: [
        {
          type: 'row',
          fields: [
            xofField('lowSeasonPerNight', 'Basse saison'),
            xofField('highSeasonPerNight', 'Haute saison'),
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          ...xofField('priceFromPerNight', 'Prix à partir de, par nuit'),
          admin: {
            readOnly: true,
            description: 'Calculé : le plus bas des deux prix saisonniers.',
          },
        },
        integerField('minNights', 'Nuits minimum', { min: 1, defaultValue: 1 }),
      ],
    },
    {
      name: 'destination',
      type: 'relationship',
      relationTo: 'destinations',
      required: true,
      label: 'Destination',
    },
    ...bookableFields(),
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
