import { describe, expect, it } from 'vitest';
import { parseDraft } from '@/lib/guides/draft';

// T020 (004, research R10) : brouillons Markdown des guides (content/carnets/README.md) :
// en-tête simple (clé: valeur, listes [a, b], booléens, une table imbriquée) et encadrés
// pratiques `:::encadre`.

const SOURCE = `---
key: que-faire
slug: que-faire-au-sine-saloum
title: "Que faire au Sine-Saloum"
metaTitle: Que faire au Sine-Saloum : 10 idées   # ≤ 60 caractères
requiresCommunityReview: true
related:
  stays: [week-end-bolong-ndangane]
  experiences: [excursion-pirogue-bolongs, quad-sine-saloum]
  accommodations: []
---

Introduction.

## Les bolongs

Texte.

:::encadre attention Marées
Horaires constatés en novembre 2026.
:::

### Fin
`;

describe('brouillon de guide', () => {
  it('en-tête : textes, guillemets, commentaires, booléens, listes et table imbriquée', () => {
    const { meta } = parseDraft(SOURCE);
    expect(meta).toEqual({
      key: 'que-faire',
      slug: 'que-faire-au-sine-saloum',
      title: 'Que faire au Sine-Saloum',
      metaTitle: 'Que faire au Sine-Saloum : 10 idées',
      requiresCommunityReview: true,
      related: {
        stays: ['week-end-bolong-ndangane'],
        experiences: ['excursion-pirogue-bolongs', 'quad-sine-saloum'],
        accommodations: [],
      },
    });
  });

  it('corps découpé en Markdown et encadrés pratiques, dans l’ordre', () => {
    const { segments } = parseDraft(SOURCE);
    expect(segments).toEqual([
      { kind: 'markdown', markdown: 'Introduction.\n\n## Les bolongs\n\nTexte.' },
      {
        kind: 'box',
        variant: 'warning',
        title: 'Marées',
        text: 'Horaires constatés en novembre 2026.',
      },
      { kind: 'markdown', markdown: '### Fin' },
    ]);
  });

  it('encadré « info » et texte sur plusieurs lignes', () => {
    const { segments } = parseDraft(
      '---\nkey: x\n---\n:::encadre info Bon à savoir\nLigne 1\nLigne 2\n:::\n',
    );
    expect(segments).toEqual([
      { kind: 'box', variant: 'info', title: 'Bon à savoir', text: 'Ligne 1\nLigne 2' },
    ]);
  });

  it('sans en-tête ou encadré non fermé : erreur explicite', () => {
    expect(() => parseDraft('Pas d’en-tête')).toThrow(/en-tête/);
    expect(() => parseDraft('---\nkey: x\n---\n:::encadre info T\nTexte\n')).toThrow(/encadré/i);
  });
});
