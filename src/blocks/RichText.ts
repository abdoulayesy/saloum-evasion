import type { Block } from 'payload';

export const RichText: Block = {
  slug: 'richText',
  labels: { singular: 'Texte', plural: 'Textes' },
  fields: [
    { name: 'content', type: 'richText', localized: true, required: true, label: 'Contenu' },
  ],
};
