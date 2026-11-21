import { describe, expect, it } from 'vitest';
import { missingMediaFields, referencedMediaIds } from '@/hooks/publishGuards';

describe('garde-fous de publication', () => {
  it('collecte les médias référencés (principal, galerie, partage, affiche), sans doublon', () => {
    expect(
      referencedMediaIds({
        heroImage: 1,
        gallery: [2, { id: 3 }, 1],
        seo: { shareImage: { id: 4 } },
        poster: 5,
        title: 'x',
      }).sort(),
    ).toEqual([1, 2, 3, 4, 5]);
    expect(referencedMediaIds({})).toEqual([]);
  });

  it('signale chaque information manquante d’une photo', () => {
    expect(
      missingMediaFields({
        alt: { fr: 'Pirogue au coucher du soleil', en: '' },
        provenance: { author: 'Awa', place: '', date: null },
      }),
    ).toEqual(['texte alternatif anglais', 'lieu', 'date de prise de vue']);
  });

  // 004 (T047) : images insérées dans le corps Lexical d'un guide.
  it('collecte aussi les images du corps Lexical, à toute profondeur', () => {
    const body = {
      root: {
        type: 'root',
        children: [
          { type: 'paragraph', children: [{ type: 'text', text: 'x' }] },
          { type: 'upload', relationTo: 'media', value: 7 },
          { type: 'list', children: [{ type: 'upload', relationTo: 'media', value: { id: 8 } }] },
          { type: 'upload', relationTo: 'documents', value: 99 },
        ],
      },
    };
    expect(referencedMediaIds({ heroImage: 1, body })).toEqual([1, 7, 8]);
  });

  it('photo complète : rien ne manque', () => {
    expect(
      missingMediaFields({
        alt: { fr: 'Pirogue', en: 'Pirogue' },
        provenance: { author: 'Awa', place: 'Ndangane', date: '2026-10-01' },
      }),
    ).toEqual([]);
  });
});
