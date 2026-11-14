import type { CollectionConfig } from 'payload';
import { anyone, isTeam } from '@/access';
import { requiredInFrench } from '@/fields/localized';
import { revalidateHooks } from '@/hooks/revalidate';

// Questions fréquentes : rattachées aux fiches par relation et listées sur /faq (FAQPage).
export const FaqItems: CollectionConfig = {
  slug: 'faqItems',
  labels: { singular: 'Question fréquente', plural: 'Questions fréquentes' },
  admin: {
    useAsTitle: 'question',
    group: 'Contenus',
    defaultColumns: ['question', 'category', 'order'],
  },
  access: { read: anyone, create: isTeam, update: isTeam, delete: isTeam },
  hooks: revalidateHooks,
  fields: [
    {
      name: 'question',
      type: 'text',
      localized: true,
      label: 'Question',
      validate: requiredInFrench(() => true, 'Question'),
    },
    {
      name: 'answer',
      type: 'richText',
      localized: true,
      label: 'Réponse',
      validate: requiredInFrench(() => true, 'Réponse'),
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'general',
      label: 'Catégorie',
      options: [
        { label: 'Général', value: 'general' },
        { label: 'Réservation', value: 'reservation' },
        { label: 'Paiement', value: 'paiement' },
        { label: 'Transport', value: 'transport' },
        { label: 'Séjour', value: 'sejour' },
      ],
    },
    { name: 'order', type: 'number', defaultValue: 0, label: 'Ordre' },
  ],
};
