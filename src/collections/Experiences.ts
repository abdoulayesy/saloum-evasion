import type { CollectionConfig } from 'payload';
import { bodyField } from '@/fields/body';
import {
  galleryField,
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

const months = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
].map((label, index) => ({ label, value: String(index + 1) }));

// Expériences (data-model) : rattachées à un univers d'expériences (qui fait partie de
// l'URL) et à une destination ; prix par personne en XOF entier.
export const Experiences: CollectionConfig = {
  slug: 'experiences',
  labels: { singular: 'Expérience', plural: 'Expériences' },
  admin: {
    useAsTitle: 'title',
    group: 'Catalogue',
    defaultColumns: ['title', 'universe', 'destination', '_status', 'updatedAt'],
  },
  ...contentDefaults({
    englishCheck: (data) =>
      hasText(data.title) &&
      hasText(data.summary) &&
      hasText(data.meetingPoint) &&
      seoComplete(data) &&
      bodyComplete(data),
  }),
  fields: [
    titleField(),
    summaryField,
    heroImageField,
    galleryField(3),
    {
      name: 'universe',
      type: 'relationship',
      relationTo: 'universes',
      required: true,
      label: 'Univers',
      filterOptions: { kind: { equals: 'experience' } },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'durationMinutes',
          type: 'number',
          required: true,
          min: 15,
          label: 'Durée (minutes)',
        },
        {
          name: 'level',
          type: 'select',
          required: true,
          defaultValue: 'facile',
          label: 'Niveau',
          options: [
            { label: 'Facile', value: 'facile' },
            { label: 'Modéré', value: 'modere' },
            { label: 'Sportif', value: 'sportif' },
          ],
        },
      ],
    },
    {
      name: 'seasonMonths',
      type: 'select',
      hasMany: true,
      required: true,
      label: 'Mois de saison',
      admin: { description: 'Les 12 mois = « toute l’année ».' },
      options: months,
    },
    {
      name: 'meetingPoint',
      type: 'text',
      localized: true,
      label: 'Point de départ',
      validate: requiredInFrench(() => true, 'Point de départ'),
    },
    {
      type: 'row',
      fields: [
        xofField('pricePerPerson', 'Prix par personne'),
        {
          name: 'minParticipants',
          type: 'number',
          defaultValue: 1,
          min: 1,
          label: 'Participants minimum',
        },
      ],
    },
    {
      name: 'destination',
      type: 'relationship',
      relationTo: 'destinations',
      required: true,
      label: 'Destination',
    },
    { name: 'faq', type: 'relationship', relationTo: 'faqItems', hasMany: true, label: 'FAQ' },
    bodyField,
    seoField(),
    localeStatusField,
    replacementTargetField('experiences'),
  ],
};
