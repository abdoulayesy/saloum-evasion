import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload';
import { bodyField } from '@/fields/body';
import {
  galleryField,
  heroImageField,
  moodOptions,
  replacementTargetField,
  summaryField,
  titleField,
  xofField,
} from '@/fields/common';
import { bodyComplete, hasText, localeStatusField, seoComplete } from '@/fields/localeStatus';
import { requiredInFrench } from '@/fields/localized';
import { seoField } from '@/fields/seo';
import { budgetBand, durationCategory, priceFrom } from '@/lib/pricing';
import { contentDefaults } from './shared';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isWholeXof = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

/** Champs calculés : catégorie de durée et tranche de budget (filtres de la liste). */
export const computeStayDerived: CollectionBeforeChangeHook = ({ data }) => {
  if (!isRecord(data)) return data;
  const next: Record<string, unknown> = { ...data };
  if (typeof data.durationNights === 'number') {
    next.durationCategory = durationCategory(data.durationNights);
  }
  const pricing = isRecord(data.pricing) ? data.pricing : {};
  if (isWholeXof(pricing.lowSeasonPerPerson) && isWholeXof(pricing.highSeasonPerPerson)) {
    next.budgetBand = budgetBand(
      priceFrom(pricing.lowSeasonPerPerson, pricing.highSeasonPerPerson),
    );
  }
  return next;
};

// Séjours signature (data-model « stays ») : offre tout compris, conditions d'annulation
// obligatoires (principe V), prix XOF entiers par saison.
export const Stays: CollectionConfig = {
  slug: 'stays',
  labels: { singular: 'Séjour signature', plural: 'Séjours signature' },
  admin: {
    useAsTitle: 'title',
    group: 'Catalogue',
    defaultColumns: ['title', 'durationNights', 'featured', '_status', 'updatedAt'],
  },
  ...contentDefaults({
    englishCheck: (data) =>
      hasText(data.title) && hasText(data.summary) && seoComplete(data) && bodyComplete(data),
    extraBeforeChange: [computeStayDerived],
  }),
  fields: [
    titleField(),
    summaryField,
    heroImageField,
    galleryField(3),
    {
      type: 'row',
      fields: [
        {
          name: 'durationNights',
          type: 'number',
          required: true,
          min: 1,
          max: 21,
          label: 'Durée (nuits)',
          validate: (value: unknown) =>
            typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 21
              ? true
              : 'Nombre entier de nuits entre 1 et 21.',
        },
        {
          name: 'durationCategory',
          type: 'select',
          label: 'Catégorie (calculée)',
          admin: { readOnly: true },
          options: [
            { label: 'Week-end (1 à 2 nuits)', value: 'weekend' },
            { label: 'Court séjour (3 à 4 nuits)', value: 'short' },
            { label: 'Semaine (5 nuits et plus)', value: 'week' },
          ],
        },
      ],
    },
    { name: 'moods', type: 'select', hasMany: true, label: 'Envies', options: moodOptions },
    {
      name: 'pricing',
      type: 'group',
      label: 'Prix TTC par personne',
      fields: [
        {
          type: 'row',
          fields: [
            xofField('lowSeasonPerPerson', 'Basse saison'),
            {
              ...xofField('highSeasonPerPerson', 'Haute saison'),
              validate: (
                value: unknown,
                { siblingData }: { siblingData: Partial<Record<string, unknown>> },
              ) => {
                if (!isWholeXof(value)) return 'Montant en FCFA entier, sans décimales.';
                const low = siblingData.lowSeasonPerPerson;
                return isWholeXof(low) && value < low
                  ? 'Le prix de haute saison doit être supérieur ou égal à celui de basse saison.'
                  : true;
              },
            },
          ],
        },
        {
          name: 'basis',
          type: 'text',
          localized: true,
          label: 'Base de prix',
          defaultValue: 'par personne, base 2 adultes',
        },
      ],
    },
    {
      name: 'budgetBand',
      type: 'select',
      label: 'Tranche de budget (calculée)',
      admin: { readOnly: true, position: 'sidebar' },
      options: [
        { label: 'Moins de 250 000 FCFA', value: 'lt250k' },
        { label: '250 000 à 500 000 FCFA', value: '250k-500k' },
        { label: 'Plus de 500 000 FCFA', value: 'gt500k' },
      ],
    },
    {
      name: 'itinerary',
      type: 'array',
      label: 'Programme jour par jour',
      minRows: 1,
      fields: [
        { name: 'day', type: 'number', required: true, min: 1, label: 'Jour' },
        {
          name: 'title',
          type: 'text',
          localized: true,
          label: 'Titre',
          validate: requiredInFrench(() => true, 'Titre du jour'),
        },
        { name: 'description', type: 'textarea', localized: true, label: 'Description' },
      ],
    },
    {
      name: 'included',
      type: 'array',
      label: 'Inclus',
      minRows: 1,
      fields: [{ name: 'item', type: 'text', localized: true, label: 'Élément' }],
    },
    {
      name: 'notIncluded',
      type: 'array',
      label: 'Non inclus',
      fields: [{ name: 'item', type: 'text', localized: true, label: 'Élément' }],
    },
    {
      name: 'cancellationPolicy',
      type: 'relationship',
      relationTo: 'cancellationPolicies',
      required: true,
      label: 'Conditions d’annulation (obligatoires)',
    },
    {
      name: 'destinations',
      type: 'relationship',
      relationTo: 'destinations',
      hasMany: true,
      minRows: 1,
      required: true,
      label: 'Destinations',
    },
    {
      name: 'accommodations',
      type: 'relationship',
      relationTo: 'accommodations',
      hasMany: true,
      label: 'Hébergements',
    },
    {
      name: 'experiences',
      type: 'relationship',
      relationTo: 'experiences',
      hasMany: true,
      label: 'Expériences',
    },
    {
      name: 'similarStays',
      type: 'relationship',
      relationTo: 'stays',
      hasMany: true,
      label: 'Séjours similaires',
      admin: { description: 'Facultatif : par défaut, même destination ou mêmes envies.' },
    },
    { name: 'faq', type: 'relationship', relationTo: 'faqItems', hasMany: true, label: 'FAQ' },
    { name: 'mapIllustration', type: 'text', label: 'Illustration de carte (identifiant SVG)' },
    { name: 'maxTravellers', type: 'number', min: 1, label: 'Voyageurs maximum' },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      label: 'Mis en avant sur l’accueil',
      admin: { position: 'sidebar' },
    },
    bodyField,
    seoField(),
    localeStatusField,
    replacementTargetField('stays'),
  ],
};
