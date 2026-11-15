import type { Block } from 'payload';

// Registre des traitements (constitution IX), publié sur la page Confidentialité.
export const ProcessingRegister: Block = {
  slug: 'processingRegister',
  labels: { singular: 'Registre des traitements', plural: 'Registres des traitements' },
  fields: [
    {
      name: 'entries',
      type: 'array',
      minRows: 1,
      fields: [
        { name: 'purpose', type: 'text', localized: true, required: true, label: 'Finalité' },
        {
          name: 'data',
          type: 'textarea',
          localized: true,
          required: true,
          label: 'Données traitées',
        },
        { name: 'legalBasis', type: 'text', localized: true, required: true, label: 'Base légale' },
        {
          name: 'retention',
          type: 'text',
          localized: true,
          required: true,
          label: 'Durée de conservation',
        },
        { name: 'recipients', type: 'text', localized: true, label: 'Destinataires' },
      ],
    },
  ],
};
