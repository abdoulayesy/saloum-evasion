// Validateurs purs, sans dépendance à Payload : testés unitairement (tests/unit/validators.test.ts)
// et branchés sur les champs du CMS.

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const E164_PATTERN = /^\+[1-9]\d{7,14}$/;
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 155;
export const BODY_MIN_WORDS = 300;

export type ValidationResult = true | string;

export const isValidSlug = (value: string): boolean => SLUG_PATTERN.test(value);

/** Slug lisible depuis un titre : minuscules, sans accents, tirets. */
export const slugify = (title: string): string =>
  title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '-')
    .replace(/&/g, ' et ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const validateSlug = (value: unknown): ValidationResult => {
  if (typeof value !== 'string' || value.length === 0) return 'Slug obligatoire.';
  return isValidSlug(value)
    ? true
    : 'Slug invalide : minuscules, chiffres et tirets uniquement (ex. week-end-bolong).';
};

export const validateLength =
  (max: number, label: string) =>
  (value: unknown): ValidationResult => {
    if (typeof value !== 'string' || value.trim().length === 0) return `${label} obligatoire.`;
    return value.length <= max ? true : `${label} : ${value.length} caractères, ${max} au maximum.`;
  };

export const validateE164 = (value: unknown): ValidationResult => {
  if (value === undefined || value === null || value === '') return true;
  return typeof value === 'string' && E164_PATTERN.test(value)
    ? true
    : 'Numéro au format international, ex. +221771234567.';
};

// --- Texte riche (Lexical) -------------------------------------------------------------

type LexicalNode = { type?: unknown; text?: unknown; children?: unknown };

const isNode = (value: unknown): value is LexicalNode =>
  typeof value === 'object' && value !== null;

const collectText = (node: unknown): string[] => {
  if (!isNode(node)) return [];
  if (node.type === 'heading') return [];
  const own = typeof node.text === 'string' ? [node.text] : [];
  const children = Array.isArray(node.children) ? node.children.flatMap(collectText) : [];
  return [...own, ...children];
};

/** Nombre de mots d'un état Lexical, titres exclus (FR-023 : 300 mots minimum). */
export const countWords = (state: unknown): number => {
  if (!isNode(state)) return 0;
  const root: unknown = 'root' in state ? state.root : state;
  const text = collectText(root).join(' ');
  return text.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
};

export const validateMinWords = (state: unknown, min = BODY_MIN_WORDS): ValidationResult => {
  const words = countWords(state);
  return words >= min ? true : `Texte de ${words} mots : ${min} au minimum pour être publié.`;
};

// --- Vidéos ----------------------------------------------------------------------------

export const validateChapters = (
  chapters: readonly { startSeconds?: number | null }[] | null | undefined,
  minCount: number,
): ValidationResult => {
  const list = chapters ?? [];
  if (list.length < minCount) return `Au moins ${minCount} chapitres.`;
  if (list.length === 0) return true;
  const starts = list.map((chapter) => chapter.startSeconds ?? -1);
  if (starts[0] !== 0) return 'Le premier chapitre commence à 0 seconde.';
  const increasing = starts.every(
    (start, index) => index === 0 || start > (starts[index - 1] ?? 0),
  );
  return increasing ? true : 'Les débuts de chapitres doivent être strictement croissants.';
};
