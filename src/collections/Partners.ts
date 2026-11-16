import type { CollectionConfig } from 'payload';
import { isAdmin, isBackOffice, isFinanceField, isStaff } from '@/access';
import { validateE164 } from '@/fields/validators';

// Prestataires (002, T018) : destinataires des notifications de réservation (WhatsApp ou e-mail
// obligatoire, FR-025) et des reversements. Lisibles par toute l'équipe (choix du prestataire
// d'une offre), gérés par les opérations et la finance. Coordonnées de reversement visibles des
// seuls rôles `finance` et `admin`.
export const Partners: CollectionConfig = {
  slug: 'partners',
  labels: { singular: 'Prestataire', plural: 'Prestataires' },
  admin: {
    useAsTitle: 'name',
    group: 'Ventes',
    defaultColumns: ['name', 'kind', 'whatsapp', 'email', 'active'],
  },
  access: {
    read: isStaff,
    create: isBackOffice,
    update: isBackOffice,
    delete: isAdmin,
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Nom' },
    {
      name: 'kind',
      type: 'select',
      required: true,
      label: 'Type',
      options: [
        { label: 'Hébergement', value: 'lodging' },
        { label: 'Guide', value: 'guide' },
        { label: 'Restaurant', value: 'restaurant' },
        { label: 'Transport', value: 'transport' },
        { label: 'Autre', value: 'other' },
      ],
    },
    { name: 'contactName', type: 'text', label: 'Contact' },
    {
      type: 'row',
      fields: [
        { name: 'phone', type: 'text', label: 'Téléphone (E.164)', validate: validateE164 },
        {
          name: 'whatsapp',
          type: 'text',
          label: 'WhatsApp (E.164)',
          validate: (
            value: unknown,
            options: { siblingData: Partial<Record<string, unknown>> },
          ) => {
            const email = options.siblingData.email;
            const empty = value === null || value === undefined || value === '';
            if (empty && (typeof email !== 'string' || email === ''))
              return 'WhatsApp ou e-mail obligatoire (notification des réservations).';
            return empty ? true : validateE164(value);
          },
        },
        { name: 'email', type: 'email', label: 'E-mail' },
      ],
    },
    {
      name: 'payoutMethod',
      type: 'select',
      required: true,
      defaultValue: 'bank_transfer',
      label: 'Mode de reversement',
      options: [
        { label: 'Virement bancaire', value: 'bank_transfer' },
        { label: 'Wave', value: 'wave' },
        { label: 'Orange Money', value: 'orange_money' },
        { label: 'Espèces', value: 'cash' },
      ],
    },
    {
      name: 'payoutDetails',
      type: 'text',
      label: 'Coordonnées de reversement',
      access: { read: isFinanceField, create: isFinanceField, update: isFinanceField },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      label: 'Actif',
      admin: { position: 'sidebar' },
    },
  ],
};
