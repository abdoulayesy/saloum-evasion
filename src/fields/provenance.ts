import type { Field } from 'payload';

// Provenance obligatoire de chaque média (constitution V : uniquement de vraies photos et
// vidéos des lieux et prestations, avec auteur, lieu et date).
export const provenanceField: Field = {
  name: 'provenance',
  type: 'group',
  label: 'Provenance (obligatoire)',
  admin: { description: 'Photo réelle du lieu ou de la prestation : qui, où, quand.' },
  fields: [
    { name: 'author', type: 'text', required: true, label: 'Auteur' },
    { name: 'place', type: 'text', required: true, label: 'Lieu' },
    { name: 'date', type: 'date', required: true, label: 'Date de prise de vue' },
  ],
};
