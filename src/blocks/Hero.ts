import type { Block } from 'payload';

export const Hero: Block = {
  slug: 'hero',
  labels: { singular: 'Héro', plural: 'Héros' },
  fields: [
    { name: 'heading', type: 'text', localized: true, required: true, label: 'Titre' },
    { name: 'text', type: 'textarea', localized: true, label: 'Texte' },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Image (élément LCP)',
    },
  ],
};
