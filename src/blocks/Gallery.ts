import type { Block } from 'payload';

export const Gallery: Block = {
  slug: 'gallery',
  labels: { singular: 'Galerie', plural: 'Galeries' },
  fields: [
    { name: 'heading', type: 'text', localized: true, label: 'Titre' },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      minRows: 1,
      label: 'Photos',
    },
  ],
};
