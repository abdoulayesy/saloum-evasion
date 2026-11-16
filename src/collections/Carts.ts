import type { CollectionConfig } from 'payload';
import { isAdmin, isBackOffice, nobody } from '@/access';
import { cartLineFields, integerField } from '@/fields/checkout';
import { validateE164 } from '@/fields/validators';

// Paniers (002, T022) : un panier serveur par visiteur, identifié par le cookie `se_cart`.
// Jamais accessible par l'API publique : seules les Server Actions y écrivent (API locale).
// `version` est incrémentée à chaque modification et sert de clé d'idempotence à la création
// de la réservation.
export const Carts: CollectionConfig = {
  slug: 'carts',
  labels: { singular: 'Panier', plural: 'Paniers' },
  admin: {
    group: 'Ventes',
    defaultColumns: ['id', 'status', 'version', 'expiresAt', 'updatedAt'],
  },
  access: { read: isBackOffice, create: nobody, update: nobody, delete: isAdmin },
  fields: [
    {
      // Empreinte SHA-256 du jeton du cookie `se_cart` (128 bits aléatoires) : le jeton lui-même
      // n'est jamais stocké, une fuite de la base ne permet pas de reprendre un panier.
      name: 'tokenHash',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Empreinte du jeton',
      access: { read: () => false, update: () => false },
      admin: { hidden: true },
    },
    {
      name: 'locale',
      type: 'select',
      required: true,
      defaultValue: 'fr',
      label: 'Langue',
      options: [
        { label: 'Français', value: 'fr' },
        { label: 'English', value: 'en' },
      ],
    },
    { name: 'items', type: 'array', label: 'Lignes', fields: cartLineFields },
    integerField('version', 'Version', { defaultValue: 0 }),
    {
      name: 'contact',
      type: 'group',
      label: 'Coordonnées',
      fields: [
        { name: 'firstName', type: 'text', label: 'Prénom' },
        { name: 'lastName', type: 'text', label: 'Nom' },
        { name: 'whatsapp', type: 'text', label: 'WhatsApp (E.164)', validate: validateE164 },
        { name: 'email', type: 'email', label: 'E-mail' },
      ],
    },
    {
      name: 'remindersConsent',
      type: 'checkbox',
      defaultValue: false,
      label: 'Accepte les relances (jamais précoché)',
    },
    integerField('remindersSent', 'Relances envoyées', { max: 2, defaultValue: 0 }),
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'open',
      index: true,
      label: 'Statut',
      options: [
        { label: 'Ouvert', value: 'open' },
        { label: 'Commandé', value: 'checked_out' },
        { label: 'Abandonné', value: 'abandoned' },
        { label: 'Expiré', value: 'expired' },
      ],
    },
    { name: 'expiresAt', type: 'date', required: true, index: true, label: 'Expire le' },
    {
      name: 'migratedFromRequest',
      type: 'checkbox',
      defaultValue: false,
      label: 'Issu de la « demande en cours »',
    },
  ],
};
