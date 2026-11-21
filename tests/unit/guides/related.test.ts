import { describe, expect, it } from 'vitest';
import { publishedIn, relatedOffers } from '@/lib/guides/related';

// T030 (004, FR-010, FR-012) : seules les offres publiées dans la langue affichée apparaissent
// dans un guide, dans l'ordre saisi, type par type.

const doc = (id: number, status: 'published' | 'draft', enPublished: boolean) => ({
  id,
  _status: status,
  localeStatus: { enPublished },
});

describe('offres liées d’un guide', () => {
  it('publiée : toujours en français, en anglais seulement si la version est complète', () => {
    expect(publishedIn(doc(1, 'published', false), 'fr')).toBe(true);
    expect(publishedIn(doc(1, 'published', false), 'en')).toBe(false);
    expect(publishedIn(doc(1, 'published', true), 'en')).toBe(true);
    expect(publishedIn(doc(1, 'draft', true), 'fr')).toBe(false);
  });

  it('relations non peuplées (identifiant seul, accès refusé) ou nulles : ignorées', () => {
    expect(publishedIn(3, 'fr')).toBe(false);
    expect(publishedIn(null, 'fr')).toBe(false);
  });

  it('ordre saisi conservé, type par type, offres non publiées retirées', () => {
    const offers = relatedOffers(
      {
        relatedStays: [doc(1, 'published', true), doc(2, 'draft', true)],
        relatedExperiences: [4, doc(5, 'published', false)],
        relatedAccommodations: null,
        relatedDestinations: [doc(7, 'published', true), doc(6, 'published', true)],
      },
      'fr',
    );
    expect(offers.map((offer) => `${offer.kind}:${offer.doc.id}`)).toEqual([
      'stay:1',
      'experience:5',
      'destination:7',
      'destination:6',
    ]);
    expect(relatedOffers({ relatedExperiences: [doc(5, 'published', false)] }, 'en')).toEqual([]);
  });
});
