import { describe, expect, it } from 'vitest';
import {
  budgetBand,
  durationCategory,
  formatEur,
  formatXof,
  priceFrom,
  toEurIndicative,
  XOF_PER_EUR,
} from '@/lib/pricing';

describe('tarification', () => {
  it('parité fixe XOF/EUR', () => expect(XOF_PER_EUR).toBe(655.957));

  it('priceFrom = plus bas des deux saisons', () => {
    expect(priceFrom(250_000, 320_000)).toBe(250_000);
    expect(priceFrom(320_000, 250_000)).toBe(250_000);
  });

  it('refuse les montants non entiers ou négatifs', () => {
    expect(() => priceFrom(250_000.5, 1)).toThrow();
    expect(() => toEurIndicative(-1)).toThrow();
  });

  it('durationCategory : 1-2 week-end, 3-4 court, 5+ semaine', () => {
    expect([1, 2, 3, 4, 5, 10].map(durationCategory)).toEqual([
      'weekend',
      'weekend',
      'short',
      'short',
      'week',
      'week',
    ]);
  });

  it('budgetBand : bornes à 250 000 et 500 000', () => {
    expect(budgetBand(249_999)).toBe('lt250k');
    expect(budgetBand(250_000)).toBe('250k-500k');
    expect(budgetBand(500_000)).toBe('250k-500k');
    expect(budgetBand(500_001)).toBe('gt500k');
  });

  it('conversion EUR arrondie à l’euro supérieur', () => {
    expect(toEurIndicative(655_957)).toBe(1000);
    expect(toEurIndicative(250_000)).toBe(382);
    expect(toEurIndicative(1)).toBe(1);
    expect(toEurIndicative(0)).toBe(0);
  });

  it('formats d’affichage', () => {
    expect(formatXof(250_000)).toBe('250 000 FCFA');
    expect(formatXof(1_250_000)).toBe('1 250 000 FCFA');
    expect(formatEur(250_000)).toBe('≈ 382 €');
    expect(formatEur(1_250_000, 'en')).toBe('≈ €1,906');
  });
});
