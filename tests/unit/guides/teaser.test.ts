import { describe, expect, it } from 'vitest';
import { MAX_TEASER_GUIDES, pickTeaserGuides } from '@/lib/guides/teaser';

// T040 (004, FR-011, research R8) : encart « À lire dans les Carnets » d'une fiche — guides
// publiés dans la langue, par priorité puis mise à jour la plus récente, trois au plus.

const guide = (
  id: number,
  priority: number | null,
  updatedOn: string | null,
  enPublished = true,
  status: 'published' | 'draft' = 'published',
) => ({ id, priority, updatedOn, _status: status, localeStatus: { enPublished } });

describe('guides de l’encart d’une fiche', () => {
  it('priorité croissante, puis mise à jour la plus récente ; trois au plus', () => {
    const picked = pickTeaserGuides(
      [
        guide(1, 100, '2026-11-01'),
        guide(2, 10, '2026-10-01'),
        guide(3, 100, '2026-12-01'),
        guide(4, null, '2026-12-15'),
        guide(5, 50, null),
      ],
      'fr',
    );
    expect(MAX_TEASER_GUIDES).toBe(3);
    expect(picked.map((item) => item.id)).toEqual([2, 5, 4]);
  });

  it('priorité absente = 100 ; à priorité égale, sans date en dernier', () => {
    const picked = pickTeaserGuides(
      [guide(1, null, null), guide(2, 100, '2026-01-01'), guide(3, null, '2026-06-01')],
      'fr',
    );
    expect(picked.map((item) => item.id)).toEqual([3, 2, 1]);
  });

  it('guides non publiés ou sans version anglaise complète : exclus', () => {
    const guides = [guide(1, 1, '2026-01-01', false), guide(2, 2, '2026-01-01', true, 'draft')];
    expect(pickTeaserGuides(guides, 'en')).toEqual([]);
    expect(pickTeaserGuides(guides, 'fr').map((item) => item.id)).toEqual([1]);
  });
});
