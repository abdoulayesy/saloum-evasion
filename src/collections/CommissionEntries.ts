import type { CollectionConfig } from 'payload';
import { isFinance, nobody } from '@/access';
import { amountField } from '@/fields/checkout';
import { immutableHooks } from '@/hooks/immutable';

// Écritures de commission (002, T025) : une par évènement financier (encaissement ou ajustement
// de remboursement), jamais modifiée ni supprimée. Base du relevé par prestataire (FR-036).
export const CommissionEntries: CollectionConfig = {
  slug: 'commissionEntries',
  labels: { singular: 'Écriture de commission', plural: 'Écritures de commission' },
  admin: {
    group: 'Finance',
    defaultColumns: ['partner', 'kind', 'grossAmount', 'commissionAmount', 'occurredAt'],
  },
  access: { read: isFinance, create: nobody, update: nobody, delete: nobody },
  hooks: immutableHooks,
  fields: [
    {
      name: 'booking',
      type: 'relationship',
      relationTo: 'bookings',
      required: true,
      label: 'Réservation',
    },
    { name: 'lineId', type: 'text', required: true, label: 'Ligne' },
    {
      name: 'partner',
      type: 'relationship',
      relationTo: 'partners',
      required: true,
      index: true,
      label: 'Prestataire',
    },
    {
      name: 'kind',
      type: 'select',
      required: true,
      label: 'Nature',
      options: [
        { label: 'Encaissement', value: 'collected' },
        { label: 'Ajustement de remboursement', value: 'refund_adjustment' },
      ],
    },
    { name: 'payment', type: 'relationship', relationTo: 'payments', label: 'Paiement' },
    { name: 'refund', type: 'relationship', relationTo: 'refunds', label: 'Remboursement' },
    amountField('grossAmount', 'Montant brut', { signed: true }),
    amountField('commissionAmount', 'Commission', { signed: true }),
    amountField('partnerAmount', 'Part prestataire', { signed: true }),
    { name: 'rateBp', type: 'number', required: true, label: 'Taux appliqué (pb)' },
    { name: 'occurredAt', type: 'date', required: true, index: true, label: 'Date de l’évènement' },
  ],
};
