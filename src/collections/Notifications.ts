import type { CollectionAfterReadHook, CollectionConfig } from 'payload';
import { isBackOffice, nobody } from '@/access';
import { integerField } from '@/fields/checkout';

/** « j***@exemple.sn », « +221 77 *** ** 34 » : lisible par l'équipe sans exposer le contact. */
export const maskRecipient = (recipient: string): string => {
  const at = recipient.indexOf('@');
  if (at > 0) return `${recipient.charAt(0)}***${recipient.slice(at)}`;
  if (recipient.length <= 6) return '***';
  return `${recipient.slice(0, 4)}***${recipient.slice(-2)}`;
};

/** Masquage dans l'admin uniquement : le serveur (API locale sans utilisateur) lit l'original. */
const maskInAdmin: CollectionAfterReadHook = ({ doc, req }) => {
  if (!req.user || typeof doc.recipient !== 'string') return doc;
  return { ...doc, recipient: maskRecipient(doc.recipient) };
};

// Journal d'envoi des notifications (002, T026) : e-mail et WhatsApp, 4 tentatives puis
// `escalated` (alerte à l'équipe, FR-023).
export const Notifications: CollectionConfig = {
  slug: 'notifications',
  labels: { singular: 'Notification envoyée', plural: 'Notifications envoyées' },
  admin: {
    group: 'Ventes',
    defaultColumns: ['template', 'channel', 'recipient', 'status', 'attempts', 'updatedAt'],
  },
  access: { read: isBackOffice, create: nobody, update: nobody, delete: nobody },
  hooks: { afterRead: [maskInAdmin] },
  fields: [
    { name: 'booking', type: 'relationship', relationTo: 'bookings', label: 'Réservation' },
    { name: 'template', type: 'text', required: true, label: 'Modèle' },
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
    { name: 'recipient', type: 'text', required: true, label: 'Destinataire' },
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
    { name: 'payload', type: 'json', label: 'Variables du modèle' },
    integerField('attempts', 'Tentatives', { max: 4, defaultValue: 0 }),
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'queued',
      index: true,
      label: 'Statut',
      options: [
        { label: 'En file', value: 'queued' },
        { label: 'Envoyée', value: 'sent' },
        { label: 'Échouée', value: 'failed' },
        { label: 'Escaladée à l’équipe', value: 'escalated' },
      ],
    },
    { name: 'providerMessageId', type: 'text', label: 'Identifiant fournisseur' },
    { name: 'lastError', type: 'textarea', label: 'Dernière erreur' },
  ],
};
