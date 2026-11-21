import { describe, expect, it } from 'vitest';
import { parentRoute } from '@/lib/parentRoute';

// T035 (004, cas limite « Guide sans traduction ») : sans version dans l'autre langue, la
// bascule mène à la page parente : la rubrique pour un guide, « À propos » pour un auteur.

describe('page parente de la bascule de langue', () => {
  it('guide → rubrique ; auteur → À propos', () => {
    expect(parentRoute({ type: 'guide', slug: 'mar-lodj' })).toEqual({ type: 'guidesHub' });
    expect(parentRoute({ type: 'author', slug: 'awa-sarr' })).toEqual({ type: 'about' });
  });

  it('contenus de la 001 inchangés', () => {
    expect(parentRoute({ type: 'stay', slug: 'x' })).toEqual({ type: 'staysList' });
    expect(parentRoute({ type: 'destination', slug: 'x' })).toEqual({ type: 'destinationsList' });
    expect(parentRoute({ type: 'film' })).toEqual({ type: 'home' });
  });
});
