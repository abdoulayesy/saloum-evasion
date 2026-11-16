import { APIError, type CollectionBeforeChangeHook, type CollectionConfig } from 'payload';
import { isBackOffice, nobody } from '@/access';
import { amountField, paymentMethodOptions } from '@/fields/checkout';
import { immutableHooks } from '@/hooks/immutable';
import {
  canTransitionPayment,
  PAYMENT_STATUSES,
  type PaymentStatus,
} from '@/lib/checkout/stateMachines';

const isPaymentStatus = (value: unknown): value is PaymentStatus =>
  PAYMENT_STATUSES.some((status) => status === value);

/** Statuts terminaux figés : une notification rejouée ne change rien (FR-019). */
export const guardPaymentStatus: CollectionBeforeChangeHook = ({
  data,
  originalDoc,
  operation,
}) => {
  if (operation !== 'update' || !data) return data;
  const from: unknown = originalDoc?.status;
  const to: unknown = data.status;
  if (!isPaymentStatus(from) || !isPaymentStatus(to) || from === to) return data;
  if (!canTransitionPayment(from, to)) {
    throw new APIError(`Statut de paiement refusé : ${from} → ${to}.`, 409);
  }
  return data;
};

const statusOptions: { label: string; value: PaymentStatus }[] = [
  { label: 'Initié', value: 'initiated' },
  { label: 'En cours', value: 'pending' },
  { label: 'Réussi', value: 'succeeded' },
  { label: 'Échoué', value: 'failed' },
  { label: 'Abandonné', value: 'abandoned' },
  { label: 'Expiré', value: 'expired' },
];

// Tentatives de paiement (002, T024). Montant toujours recalculé côté serveur. Une seule
// tentative active par réservation et par objet : index unique partiel posé par migration SQL.
export const Payments: CollectionConfig = {
  slug: 'payments',
  labels: { singular: 'Paiement', plural: 'Paiements' },
  admin: {
    group: 'Ventes',
    defaultColumns: ['booking', 'purpose', 'method', 'amount', 'status', 'createdAt'],
  },
  access: { read: isBackOffice, create: nobody, update: nobody, delete: nobody },
  hooks: { beforeChange: [guardPaymentStatus], beforeDelete: immutableHooks.beforeDelete },
  fields: [
    {
      name: 'booking',
      type: 'relationship',
      relationTo: 'bookings',
      required: true,
      index: true,
      label: 'Réservation',
    },
    {
      name: 'purpose',
      type: 'select',
      required: true,
      label: 'Objet',
      options: [
        { label: 'Paiement total', value: 'full' },
        { label: 'Acompte', value: 'deposit' },
        { label: 'Solde', value: 'balance' },
      ],
    },
    {
      name: 'method',
      type: 'select',
      required: true,
      label: 'Moyen',
      options: paymentMethodOptions,
    },
    amountField('amount', 'Montant'),
    { name: 'currency', type: 'text', required: true, defaultValue: 'XOF', label: 'Devise' },
    { name: 'gateway', type: 'text', required: true, label: 'Passerelle' },
    {
      name: 'idempotencyKey',
      type: 'text',
      required: true,
      unique: true,
      label: 'Clé d’idempotence',
    },
    { name: 'gatewayReference', type: 'text', unique: true, label: 'Référence passerelle' },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'initiated',
      index: true,
      label: 'Statut',
      options: statusOptions,
    },
    {
      name: 'failureReason',
      type: 'select',
      label: 'Cause d’échec',
      options: [
        { label: 'Refusé', value: 'declined' },
        { label: 'Solde insuffisant', value: 'insufficient_funds' },
        { label: 'Délai dépassé', value: 'timeout' },
        { label: 'Annulé par le voyageur', value: 'cancelled_by_user' },
        { label: 'Problème technique', value: 'technical' },
      ],
    },
    { name: 'redirectUrl', type: 'text', label: 'Page de paiement hébergée' },
    { name: 'expiresAt', type: 'date', required: true, label: 'Expire le' },
    { name: 'confirmedAt', type: 'date', label: 'Confirmé le' },
  ],
};
