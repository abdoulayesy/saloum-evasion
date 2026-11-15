import { describe, expect, it } from 'vitest';
import {
  applyFilters,
  EMPTY_FILTERS,
  isEmptyFilters,
  matchesFilters,
  parseFilters,
  serializeFilters,
  toggleValue,
} from '@/lib/filters';

const stays = [
  {
    id: 1,
    durationCategory: 'weekend' as const,
    moods: ['nature', 'detente'],
    budgetBand: 'lt250k' as const,
  },
  {
    id: 2,
    durationCategory: 'short' as const,
    moods: ['culture'],
    budgetBand: '250k-500k' as const,
  },
  {
    id: 3,
    durationCategory: 'week' as const,
    moods: ['nature', 'aventure'],
    budgetBand: 'gt500k' as const,
  },
];

describe('filtres de la liste des séjours', () => {
  it('lit les paramètres, ignore les valeurs inconnues, accepte les listes séparées par des virgules', () => {
    expect(
      parseFilters(
        new URLSearchParams('duree=weekend,inconnu&envie=nature&envie=culture&budget=lt250k'),
      ),
    ).toEqual({
      durations: ['weekend'],
      moods: ['nature', 'culture'],
      budgets: ['lt250k'],
    });
    expect(parseFilters(new URLSearchParams(''))).toEqual(EMPTY_FILTERS);
  });

  it('écrit une requête canonique et conserve les autres paramètres', () => {
    const base = new URLSearchParams('arrivee=2026-12-01&duree=week');
    expect(
      serializeFilters({ durations: ['week', 'weekend'], moods: ['detente'], budgets: [] }, base),
    ).toBe('arrivee=2026-12-01&duree=weekend%2Cweek&envie=detente');
    expect(serializeFilters(EMPTY_FILTERS)).toBe('');
  });

  it('OU dans un groupe, ET entre groupes', () => {
    expect(
      applyFilters(stays, { durations: ['weekend', 'week'], moods: [], budgets: [] }).map(
        (s) => s.id,
      ),
    ).toEqual([1, 3]);
    expect(
      applyFilters(stays, { durations: [], moods: ['nature'], budgets: ['gt500k'] }).map(
        (s) => s.id,
      ),
    ).toEqual([3]);
    expect(applyFilters(stays, EMPTY_FILTERS)).toHaveLength(3);
    expect(
      matchesFilters(
        { durationCategory: null, moods: [], budgetBand: null },
        { durations: ['weekend'], moods: [], budgets: [] },
      ),
    ).toBe(false);
  });

  it('bascule et état vide', () => {
    expect(toggleValue(['nature'], 'culture')).toEqual(['nature', 'culture']);
    expect(toggleValue(['nature', 'culture'], 'nature')).toEqual(['culture']);
    expect(isEmptyFilters(EMPTY_FILTERS)).toBe(true);
  });
});
