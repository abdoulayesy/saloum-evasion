import type { Block } from 'payload';

export const Steps: Block = {
  slug: 'steps',
  labels: { singular: 'Étapes', plural: 'Étapes' },
  fields: [
    { name: 'heading', type: 'text', localized: true, label: 'Titre' },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      fields: [
        { name: 'title', type: 'text', localized: true, required: true, label: 'Titre' },
        { name: 'text', type: 'textarea', localized: true, label: 'Texte' },
      ],
    },
  ],
};
