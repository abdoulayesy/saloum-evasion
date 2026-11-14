import type { Field } from 'payload';
import { requiredInFrench } from './localized';
import { validateMinWords } from './validators';

// Texte principal des fiches (FR-023) : au moins 300 mots par langue publiée, titres exclus.
// La validation ne s'applique qu'à la publication (les brouillons ne sont pas validés).
export const bodyField: Field = {
  name: 'body',
  type: 'richText',
  localized: true,
  label: 'Texte principal',
  admin: { description: 'Au moins 300 mots (hors titres) pour publier dans une langue.' },
  validate: requiredInFrench((value) => validateMinWords(value), 'Texte principal'),
};
