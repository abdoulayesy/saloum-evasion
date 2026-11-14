import type { Block } from 'payload';

// Affiche les garanties définies dans les réglages du site (source unique).
export const Guarantees: Block = {
  slug: 'guarantees',
  labels: { singular: 'Garanties', plural: 'Garanties' },
  fields: [{ name: 'heading', type: 'text', localized: true, label: 'Titre' }],
};
