import type { Block } from 'payload';

// « Encadré pratique » du corps des guides (004, research R2) : information utile mise en
// évidence (tarif daté, horaire, conseil de sécurité). Bloc Lexical, rendu en `<aside>`.
export const PracticalBox: Block = {
  slug: 'practicalBox',
  labels: { singular: 'Encadré pratique', plural: 'Encadrés pratiques' },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Titre' },
    { name: 'text', type: 'textarea', required: true, label: 'Texte' },
    {
      name: 'variant',
      type: 'select',
      required: true,
      defaultValue: 'info',
      label: 'Type',
      options: [
        { label: 'Information', value: 'info' },
        { label: 'Attention', value: 'warning' },
      ],
    },
  ],
};
