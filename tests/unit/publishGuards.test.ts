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

  it('photo complète : rien ne manque', () => {
    expect(
      missingMediaFields({
        alt: { fr: 'Pirogue', en: 'Pirogue' },
        provenance: { author: 'Awa', place: 'Ndangane', date: '2026-10-01' },
      }),
    ).toEqual([]);
  });
});
