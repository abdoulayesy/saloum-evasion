import { describe, expect, it } from 'vitest';
import { headingAnchor, MIN_TOC_ENTRIES, tocOf } from '@/lib/guides/toc';

// T011 (004, FR-004, research R2) : table des matières extraite des H2 du corps Lexical,
// ancres stables partagées avec le rendu des titres.

const text = (value: string) => ({ type: 'text', text: value, format: 0 });
const heading = (tag: 'h2' | 'h3', ...children: unknown[]) => ({ type: 'heading', tag, children });
const paragraph = (value: string) => ({ type: 'paragraph', children: [text(value)] });
const state = (...children: unknown[]) => ({ root: { type: 'root', children } });

describe('ancre d’intertitre', () => {
  it('slug sans accents ni ponctuation', () => {
    expect(headingAnchor('Quand partir ? Saisons & marées', new Map())).toBe(
      'quand-partir-saisons-marees',
    );
  });

  it('doublons numérotés dans l’ordre', () => {
    const seen = new Map<string, number>();
    expect(headingAnchor('En famille', seen)).toBe('en-famille');
    expect(headingAnchor('En famille', seen)).toBe('en-famille-2');
    expect(headingAnchor('En famille', seen)).toBe('en-famille-3');
  });

  it('intertitre sans lettre ni chiffre : ancre de repli', () => {
    expect(headingAnchor('…', new Map())).toBe('section');
  });
});

describe('table des matières', () => {
  it('H2 seulement, texte des nœuds enfants concaténé', () => {
    const entries = tocOf(
      state(
        paragraph('Intro'),
        heading('h2', text('Les '), { type: 'text', text: 'îles', format: 1 }),
        heading('h3', text('Mar Lodj')),
        heading('h2', text('Les bolongs')),
        heading('h2', text('En famille')),
      ),
    );
    expect(entries).toEqual([
      { id: 'les-iles', text: 'Les îles' },
      { id: 'les-bolongs', text: 'Les bolongs' },
      { id: 'en-famille', text: 'En famille' },
    ]);
  });

  it('liens dans un intertitre : texte conservé', () => {
    const entries = tocOf(
      state(heading('h2', { type: 'link', children: [text('Ndangane')] }, text(' en pirogue'))),
    );
    expect(entries[0]?.text).toBe('Ndangane en pirogue');
  });

  it('corps vide ou invalide : aucune entrée', () => {
    expect(tocOf(null)).toEqual([]);
    expect(tocOf({})).toEqual([]);
    expect(tocOf(state())).toEqual([]);
  });

  it('seuil d’affichage de trois intertitres', () => {
    expect(MIN_TOC_ENTRIES).toBe(3);
  });
});
