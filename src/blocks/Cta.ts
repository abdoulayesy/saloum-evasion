import type { Block } from 'payload';

export const Cta: Block = {
  slug: 'cta',
  labels: { singular: 'Appel à l’action', plural: 'Appels à l’action' },
  fields: [
    { name: 'heading', type: 'text', localized: true, required: true, label: 'Titre' },
    { name: 'text', type: 'textarea', localized: true, label: 'Texte' },
    {
      name: 'action',
      type: 'select',
      required: true,
      defaultValue: 'request',
      label: 'Action',
      options: [
        { label: 'Demander un séjour', value: 'request' },
        { label: 'Écrire sur WhatsApp', value: 'whatsapp' },
        { label: 'Voir les séjours', value: 'stays' },
      ],
    },
  ],
};
