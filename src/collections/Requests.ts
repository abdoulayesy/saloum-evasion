import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload';
import { isAdmin, isTeam, nobody } from '@/access';
import { moodOptions } from '@/fields/common';
import { validateE164 } from '@/fields/validators';

const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Référence lisible `SE-AAAAMMJJ-XXXX` (date de Dakar = UTC). */
export const buildRequestReference = (date: Date, random: () => number = Math.random): string => {
  const day = date.toISOString().slice(0, 10).replaceAll('-', '');
  const suffix = Array.from({ length: 4 }, () => {
    const index = Math.floor(random() * REFERENCE_ALPHABET.length);
    return REFERENCE_ALPHABET[index] ?? 'X';
  }).join('');
  return `SE-${day}-${suffix}`;
};

const assignReference: CollectionBeforeChangeHook = ({ data, operation }) => {
  if (operation !== 'create' || (typeof data.reference === 'string' && data.reference !== ''))
    return data;
  return { ...data, reference: buildRequestReference(new Date()) };
};

// Demandes de séjour (data-model « requests ») : non publiques. Création uniquement par la
// Server Action (API locale), jamais par l'API REST publique ; lecture et suivi par l'équipe.
export const Requests: CollectionConfig = {
  slug: 'requests',
  labels: { singular: 'Demande de séjour', plural: 'Demandes de séjour' },
  admin: {
    useAsTitle: 'reference',
    group: 'Demandes',
    defaultColumns: ['reference', 'firstName', 'arrivalDate', 'status', 'notifiedAt', 'createdAt'],
  },
  access: { create: nobody, read: isTeam, update: isTeam, delete: isAdmin },
  hooks: { beforeChange: [assignReference] },
  fields: [
    {
      name: 'reference',
      type: 'text',
      unique: true,
      index: true,
      label: 'Référence',
      admin: { readOnly: true },
    },
    {
      name: 'submissionId',
      type: 'text',
      unique: true,
      required: true,
      label: 'Identifiant d’envoi',
      admin: { readOnly: true, hidden: true },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      label: 'Statut',
      admin: { position: 'sidebar' },
      options: [
        { label: 'Nouvelle', value: 'new' },
        { label: 'En cours', value: 'in_progress' },
        { label: 'Devis envoyé', value: 'quoted' },
        { label: 'Gagnée', value: 'won' },
        { label: 'Perdue', value: 'lost' },
        { label: 'Spam', value: 'spam' },
      ],
    },
    {
      name: 'items',
      type: 'array',
      maxRows: 10,
      label: 'Éléments choisis',
      fields: [
        {
          name: 'kind',
          type: 'select',
          required: true,
          options: [
            { label: 'Séjour', value: 'stay' },
            { label: 'Expérience', value: 'experience' },
            { label: 'Hébergement', value: 'accommodation' },
          ],
        },
        {
          name: 'doc',
          type: 'relationship',
          relationTo: ['stays', 'experiences', 'accommodations'],
        },
        {
          name: 'titleSnapshot',
          type: 'text',
          required: true,
          label: 'Titre au moment de la demande',
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'arrivalDate', type: 'date', required: true, label: 'Arrivée' },
        { name: 'departureDate', type: 'date', label: 'Départ' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'adults', type: 'number', required: true, min: 1, max: 30, label: 'Adultes' },
        { name: 'children', type: 'number', defaultValue: 0, min: 0, max: 20, label: 'Enfants' },
      ],
    },
    { name: 'moods', type: 'select', hasMany: true, options: moodOptions, label: 'Envies' },
    {
      name: 'budgetBand',
      type: 'select',
      label: 'Budget indicatif',
      options: [
        { label: 'Moins de 250 000 FCFA', value: 'lt250k' },
        { label: '250 000 à 500 000 FCFA', value: '250k-500k' },
        { label: 'Plus de 500 000 FCFA', value: 'gt500k' },
      ],
    },
    { name: 'firstName', type: 'text', required: true, maxLength: 60, label: 'Prénom' },
    {
      name: 'whatsapp',
      type: 'text',
      required: true,
      label: 'WhatsApp',
      validate: (value: unknown) =>
        value === undefined || value === null || value === ''
          ? 'Numéro obligatoire.'
          : validateE164(value),
    },
    { name: 'email', type: 'email', label: 'E-mail' },
    { name: 'message', type: 'textarea', maxLength: 1000, label: 'Message' },
    {
      name: 'locale',
      type: 'select',
      required: true,
      options: [
        { label: 'Français', value: 'fr' },
        { label: 'English', value: 'en' },
      ],
    },
    { name: 'sourcePath', type: 'text', label: 'Page d’origine' },
    {
      name: 'consentAt',
      type: 'date',
      required: true,
      label: 'Consentement',
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'notifiedAt',
      type: 'date',
      label: 'Équipe notifiée le',
      admin: { readOnly: true, position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'notifyAttempts',
      type: 'number',
      defaultValue: 0,
      label: 'Envois tentés',
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
};
