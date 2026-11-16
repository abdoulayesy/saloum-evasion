import { describe, expect, it } from 'vitest';
import { addItem, emptyDraft, parseDraft, removeItem, tripFromSearch } from '@/lib/request/draft';

const NOW = new Date('2026-11-15T10:00:00Z');
const item = (slug: string) => ({ kind: 'experience' as const, slug, title: `Expérience ${slug}` });

describe('demande en cours (brouillon local)', () => {
  it('ajoute sans doublon et au plus 10 éléments', () => {
    let draft = emptyDraft(NOW);
    draft = addItem(draft, item('a'), NOW);
    draft = addItem(draft, item('a'), NOW);
    expect(draft.items).toHaveLength(1);
    for (let index = 0; index < 15; index += 1) draft = addItem(draft, item(`x${index}`), NOW);
    expect(draft.items).toHaveLength(10);
  });

  it('un même slug de type différent est un autre élément', () => {
    const draft = addItem(
      addItem(emptyDraft(NOW), item('ndangane'), NOW),
      { kind: 'stay', slug: 'ndangane', title: 'Séjour' },
      NOW,
    );
    expect(draft.items).toHaveLength(2);
  });

  it('retire un élément', () => {
    const draft = removeItem(addItem(emptyDraft(NOW), item('a'), NOW), 'experience', 'a', NOW);
    expect(draft.items).toEqual([]);
  });

  it('expire après 30 jours et ignore un contenu invalide', () => {
    const fresh = JSON.stringify({ ...addItem(emptyDraft(NOW), item('a'), NOW) });
    expect(parseDraft(fresh, new Date('2026-12-10T00:00:00Z')).items).toHaveLength(1);
    expect(parseDraft(fresh, new Date('2026-12-20T00:00:00Z')).items).toEqual([]);
    expect(parseDraft('{pas du json', NOW).items).toEqual([]);
    expect(parseDraft(JSON.stringify({ version: 2, items: [] }), NOW).items).toEqual([]);
    expect(
      parseDraft(
        JSON.stringify({
          version: 1,
          updatedAt: NOW.toISOString(),
          items: [{ kind: 'x', slug: 1 }],
        }),
        NOW,
      ).items,
    ).toEqual([]);
  });

  it('lit dates et voyageurs dans l’URL de recherche', () => {
    expect(
      tripFromSearch(
        new URLSearchParams('arrivee=2026-12-04&depart=2026-12-06&adultes=2&enfants=1'),
      ),
    ).toEqual({ arrivalDate: '2026-12-04', departureDate: '2026-12-06', adults: 2, children: 1 });
    expect(tripFromSearch(new URLSearchParams('arrivee=demain&adultes=-1'))).toEqual({
      arrivalDate: undefined,
      departureDate: undefined,
      adults: undefined,
      children: undefined,
    });
  });
});
