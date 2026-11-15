import type { Block } from 'payload';

export const Team: Block = {
  slug: 'team',
  labels: { singular: 'Équipe', plural: 'Équipes' },
  fields: [
    { name: 'heading', type: 'text', localized: true, label: 'Titre' },
    {
      name: 'members',
      type: 'relationship',
      relationTo: 'teamMembers',
      hasMany: true,
      label: 'Membres',
    },
  ],
};
