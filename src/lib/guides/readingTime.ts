import { countWords } from '@/fields/validators';

// Temps de lecture d'un guide (004, research R6). Pur : 200 mots par minute, arrondi au
// supérieur, au moins une minute.

export const WORDS_PER_MINUTE = 200;

export const readingMinutes = (body: unknown): number =>
  Math.max(1, Math.ceil(countWords(body) / WORDS_PER_MINUTE));
