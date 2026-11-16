import type { CollectionConfig } from 'payload';
import { isAdmin, isFinance } from '@/access';
import { amountField, civilDateField } from '@/fields/checkout';

// Reversements aux prestataires (002, T025). Relevé (FR-036) = écritures de la période −
// reversements de la période.
export const Payouts: CollectionConfig = {
  slug: 'payouts',
  labels: { singular: 'Reversement', plural: 'Reversements' },
  admin: {
    group: 'Finance',
    defaultColumns: ['partner', 'periodStart', 'periodEnd', 'amount', 'paidAt'],
  },
  access: { read: isFinance, create: isFinance, update: isFinance, delete: isAdmin },
  fields: [
    {
      name: 'partner',
      type: 'relationship',
      relationTo: 'partners',
      required: true,
      index: true,
      label: 'Prestataire',
    },
    {
      type: 'row',
      fields: [
        civilDateField('periodStart', 'Début de période', true),
        civilDateField('periodEnd', 'Fin de période', true),
      ],
    },
    amountField('amount', 'Montant reversé'),
    {
      name: 'method',
      type: 'select',
      required: true,
      label: 'Moyen',
      options: [
        { label: 'Virement bancaire', value: 'bank_transfer' },
        { label: 'Wave', value: 'wave' },
        { label: 'Orange Money', value: 'orange_money' },
        { label: 'Espèces', value: 'cash' },
      ],
    },
    { name: 'reference', type: 'text', label: 'Référence du versement' },
    { name: 'paidAt', type: 'date', required: true, label: 'Versé le' },
    { name: 'recordedBy', type: 'relationship', relationTo: 'users', label: 'Saisi par' },
  ],
};
