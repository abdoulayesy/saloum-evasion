import { describe, expect, it } from 'vitest';
import { isReviewDue, nextGuideDates } from '@/lib/guides/dates';

// T013 (004, FR-006, FR-018, research R3) : date de première publication figée ; date de mise
// à jour changée seulement par une mise à jour de fond ; « à revoir » au-delà de 12 mois.

describe('dates d’un guide', () => {
  it('première publication : les deux dates valent aujourd’hui', () => {
    expect(
      nextGuideDates({
        publishing: true,
        previous: { publishedOn: null, updatedOn: null },
        substantive: false,
        today: '2026-11-20',
      }),
    ).toEqual({ publishedOn: '2026-11-20', updatedOn: '2026-11-20' });
  });

  it('correction mineure : dates inchangées', () => {
    expect(
      nextGuideDates({
        publishing: true,
        previous: { publishedOn: '2026-11-20', updatedOn: '2026-12-01' },
        substantive: false,
        today: '2027-02-10',
      }),
    ).toEqual({ publishedOn: '2026-11-20', updatedOn: '2026-12-01' });
  });

  it('mise à jour de fond : nouvelle date de mise à jour, première publication conservée', () => {
    expect(
      nextGuideDates({
        publishing: true,
        previous: { publishedOn: '2026-11-20', updatedOn: '2026-12-01' },
        substantive: true,
        today: '2027-02-10',
      }),
    ).toEqual({ publishedOn: '2026-11-20', updatedOn: '2027-02-10' });
  });

  it('brouillon : aucune date posée, même avec « mise à jour importante »', () => {
    expect(
      nextGuideDates({
        publishing: false,
        previous: { publishedOn: null, updatedOn: null },
        substantive: true,
        today: '2026-11-20',
      }),
    ).toEqual({ publishedOn: null, updatedOn: null });
  });
});

describe('guide à revoir', () => {
  it('plus de 12 mois sans mise à jour de fond', () => {
    expect(isReviewDue('2025-11-20', '2026-11-20')).toBe(false);
    expect(isReviewDue('2025-11-19', '2026-11-20')).toBe(true);
  });

  it('29 février : comparé au 28 février de l’année suivante', () => {
    expect(isReviewDue('2028-02-29', '2029-02-28')).toBe(false);
    expect(isReviewDue('2028-02-29', '2029-03-01')).toBe(true);
  });

  it('jamais publié : rien à revoir', () => {
    expect(isReviewDue(null, '2026-11-20')).toBe(false);
  });
});
