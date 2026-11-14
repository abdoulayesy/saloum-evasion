import type { Block } from 'payload';

export const Figures: Block = {
  slug: 'figures',
  labels: { singular: 'Chiffres clés', plural: 'Chiffres clés' },
  fields: [
    { name: 'heading', type: 'text', localized: true, label: 'Titre' },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      maxRows: 6,
      fields: [
        { name: 'value', type: 'text', required: true, label: 'Valeur' },
        { name: 'label', type: 'text', localized: true, required: true, label: 'Libellé' },
      ],
    },
  ],
};
