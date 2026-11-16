import type { CollectionConfig } from 'payload';
import { isFinance, nobody } from '@/access';
import { immutableHooks } from '@/hooks/immutable';

// Journal des notifications de paiement (002, T024) : une ligne par notification reçue, signée ou
// non. `gatewayEventId` unique : une notification rejouée est ignorée. Immuable, même pour admin.
// Aucune donnée de carte : l'agrégateur n'en transmet pas.
export const PaymentEvents: CollectionConfig = {
  slug: 'paymentEvents',
  labels: { singular: 'Notification de paiement', plural: 'Notifications de paiement' },
  admin: {
    group: 'Ventes',
    defaultColumns: ['gatewayEventId', 'type', 'signatureValid', 'receivedAt'],
  },
  access: { read: isFinance, create: nobody, update: nobody, delete: nobody },
  hooks: immutableHooks,
  fields: [
    { name: 'payment', type: 'relationship', relationTo: 'payments', label: 'Paiement' },
    {
      name: 'gatewayEventId',
      type: 'text',
      required: true,
      unique: true,
      label: 'Identifiant de l’évènement',
    },
    { name: 'type', type: 'text', required: true, label: 'Type' },
    { name: 'payload', type: 'json', label: 'Contenu reçu' },
    { name: 'signatureValid', type: 'checkbox', defaultValue: false, label: 'Signature valide' },
    { name: 'receivedAt', type: 'date', required: true, label: 'Reçue le' },
  ],
};
