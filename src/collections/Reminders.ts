import type { CollectionConfig } from 'payload';
import { isBackOffice, nobody } from '@/access';
import { integerField } from '@/fields/checkout';

// Relances (002, T026) : panier abandonné, paiement échoué, solde à régler ou en retard. La cible
// est notée par type + identifiant (et non par relation polymorphe) pour porter l'index unique
// `(cible, type, canal, rang)` : au plus deux relances d'abandon (FR-031).
export const Reminders: CollectionConfig = {
  slug: 'reminders',
  labels: { singular: 'Relance', plural: 'Relances' },
  admin: {
    group: 'Ventes',
    defaultColumns: ['kind', 'channel', 'targetType', 'targetId', 'status', 'scheduledFor'],
  },
  access: { read: isBackOffice, create: nobody, update: nobody, delete: nobody },
  indexes: [{ fields: ['targetType', 'targetId', 'kind', 'channel', 'rank'], unique: true }],
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'targetType',
          type: 'select',
          required: true,
          label: 'Cible',
          options: [
            { label: 'Panier', value: 'carts' },
            { label: 'Réservation', value: 'bookings' },
          ],
        },
        integerField('targetId', 'Identifiant de la cible', { min: 1 }),
      ],
    },
    {
      name: 'kind',
      type: 'select',
      required: true,
      label: 'Type',
      options: [
        { label: 'Panier abandonné', value: 'abandoned_cart' },
        { label: 'Paiement échoué', value: 'failed_payment' },
        { label: 'Solde à régler', value: 'balance_due' },
        { label: 'Solde en retard', value: 'balance_overdue' },
      ],
    },
    {
      name: 'channel',
      type: 'select',
      required: true,
      label: 'Canal',
      options: [
        { label: 'E-mail', value: 'email' },
        { label: 'WhatsApp', value: 'whatsapp' },
      ],
    },
    integerField('rank', 'Rang', { min: 1, max: 2, defaultValue: 1 }),
    { name: 'scheduledFor', type: 'date', required: true, index: true, label: 'Prévue le' },
    { name: 'sentAt', type: 'date', label: 'Envoyée le' },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'scheduled',
      label: 'Statut',
      options: [
        { label: 'Programmée', value: 'scheduled' },
        { label: 'Envoyée', value: 'sent' },
        { label: 'Échouée', value: 'failed' },
        { label: 'Annulée', value: 'cancelled' },
      ],
    },
    { name: 'linkOpenedAt', type: 'date', label: 'Lien ouvert le' },
    { name: 'unsubscribed', type: 'checkbox', defaultValue: false, label: 'Désinscrit' },
  ],
};
