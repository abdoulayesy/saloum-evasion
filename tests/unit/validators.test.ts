import { describe, expect, it } from 'vitest';
import {
  countWords,
  DESCRIPTION_MAX,
  slugify,
  TITLE_MAX,
  validateChapters,
  validateE164,
  validateLength,
  validateMinWords,
  validateSlug,
} from '@/fields/validators';

const paragraph = (text: string) => ({
  type: 'paragraph',
  children: [{ type: 'text', text }],
});

const lexical = (...children: object[]) => ({ root: { type: 'root', children } });

describe('slugs', () => {
  it.each(['week-end-bolong', 'mar-lodj', 'a', 'sejour-3-nuits'])('%s est valide', (slug) =>
    expect(validateSlug(slug)).toBe(true),
  );
  it.each(['Week-end', 'week_end', '-debut', 'fin-', 'double--tiret', 'é', '', 'a b'])(
    '« %s » est invalide',
    (slug) => expect(validateSlug(slug)).not.toBe(true),
  );
  it('slugify : accents, apostrophes, esperluette', () => {
    expect(slugify('Île aux Oiseaux')).toBe('ile-aux-oiseaux');
    expect(slugify('Week-end à Ndangane')).toBe('week-end-a-ndangane');
    expect(slugify('L’île de Mar Lodj')).toBe('l-ile-de-mar-lodj');
    expect(slugify('Mangrove & îles')).toBe('mangrove-et-iles');
    expect(validateSlug(slugify('  Séjour  « signature » ! '))).toBe(true);
  });
});

describe('longueurs', () => {
  const title = validateLength(TITLE_MAX, 'Titre SEO');
  const description = validateLength(DESCRIPTION_MAX, 'Description');
  it('title : 60 accepté, 61 refusé, vide refusé', () => {
    expect(title('x'.repeat(60))).toBe(true);
    expect(title('x'.repeat(61))).toMatch(/61 caractères/);
    expect(title('   ')).toMatch(/obligatoire/);
  });
  it('description : 155 accepté, 156 refusé', () => {
    expect(description('x'.repeat(155))).toBe(true);
    expect(description('x'.repeat(156))).not.toBe(true);
  });
});

describe('comptage de mots', () => {
  it('compte le texte des paragraphes et des listes', () => {
    const state = lexical(paragraph('Un deux trois.'), {
      type: 'list',
      children: [{ type: 'listitem', children: [{ type: 'text', text: 'quatre cinq' }] }],
    });
    expect(countWords(state)).toBe(5);
  });
  it('exclut les titres', () => {
    const state = lexical(
      { type: 'heading', tag: 'h2', children: [{ type: 'text', text: 'Titre de section ignoré' }] },
      paragraph('Seulement trois mots'),
    );
    expect(countWords(state)).toBe(3);
  });
  it('ignore la ponctuation isolée et les états vides', () => {
    expect(countWords(lexical(paragraph('Bonjour — le Saloum !')))).toBe(3);
    expect(countWords(null)).toBe(0);
    expect(countWords({})).toBe(0);
  });
  it('300 mots minimum', () => {
    expect(validateMinWords(lexical(paragraph('mot '.repeat(299))))).toMatch(/299 mots/);
    expect(validateMinWords(lexical(paragraph('mot '.repeat(300))))).toBe(true);
  });
});

describe('numéros WhatsApp (E.164)', () => {
  it.each(['+221771234567', '+33612345678'])('%s accepté', (value) =>
    expect(validateE164(value)).toBe(true),
  );
  it.each(['0771234567', '+0771234567', '+22177', '221771234567'])('%s refusé', (value) =>
    expect(validateE164(value)).not.toBe(true),
  );
  it('vide accepté (champ facultatif)', () => expect(validateE164('')).toBe(true));
});

describe('chapitres vidéo', () => {
  it('premier à 0, strictement croissants', () => {
    expect(validateChapters([{ startSeconds: 0 }, { startSeconds: 42 }], 2)).toBe(true);
    expect(validateChapters([{ startSeconds: 5 }, { startSeconds: 42 }], 2)).toMatch(/0 seconde/);
    expect(validateChapters([{ startSeconds: 0 }, { startSeconds: 0 }], 2)).toMatch(/croissants/);
    expect(validateChapters([{ startSeconds: 0 }], 2)).toMatch(/Au moins 2/);
    expect(validateChapters(undefined, 0)).toBe(true);
  });
});
