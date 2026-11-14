import type { CollectionSlug, Field, NumberField } from 'payload';
import { requiredInFrench } from './localized';

// Champs partagés entre collections de contenu.

export const titleField = (label = 'Titre'): Field => ({
  name: 'title',
  type: 'text',
  localized: true,
  label,
  validate: requiredInFrench(() => true, label),
});

export const summaryField: Field = {
  name: 'summary',
  type: 'textarea',
  localized: true,
  label: 'Résumé (cartes de liste)',
  maxLength: 200,
  validate: requiredInFrench(
    (value) =>
      typeof value === 'string' && value.length <= 200 ? true : '200 caractères au maximum.',
    'Résumé',
  ),
};

export const heroImageField: Field = {
  name: 'heroImage',
  type: 'upload',
  relationTo: 'media',
  required: true,
  label: 'Image principale',
};

export const galleryField = (min: number, max = 20): Field => ({
  name: 'gallery',
  type: 'upload',
  relationTo: 'media',
  hasMany: true,
  label: 'Galerie',
  minRows: min,
  maxRows: max,
});

export const replacementTargetField = (relationTo: CollectionSlug): Field => ({
  name: 'replacementTarget',
  type: 'relationship',
  relationTo,
  label: 'Page de remplacement',
  admin: {
    position: 'sidebar',
    description:
      'Si ce contenu est dépublié ou supprimé, son adresse redirige ici (sinon vers la liste parente).',
  },
});

export const geoField: Field = {
  name: 'geo',
  type: 'group',
  label: 'Coordonnées GPS',
  fields: [
    { name: 'latitude', type: 'number', required: true, min: -90, max: 90 },
    { name: 'longitude', type: 'number', required: true, min: -180, max: 180 },
  ],
};

export const moodOptions = [
  { label: 'Nature', value: 'nature' },
  { label: 'Culture', value: 'culture' },
  { label: 'Gastronomie', value: 'gastronomie' },
  { label: 'Détente', value: 'detente' },
  { label: 'Aventure', value: 'aventure' },
  { label: 'Famille', value: 'famille' },
];

export const xofField = (name: string, label: string, required = true): NumberField => ({
  name,
  type: 'number',
  label: `${label} (FCFA)`,
  required,
  min: 0,
  validate: (value: unknown) => {
    if (value === null || value === undefined) return required ? `${label} obligatoire.` : true;
    return typeof value === 'number' && Number.isInteger(value) && value >= 0
      ? true
      : 'Montant en FCFA entier, sans décimales.';
  },
});
