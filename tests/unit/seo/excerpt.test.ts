import { describe, expect, it } from 'vitest';
import { excerpt } from '@/lib/seo/excerpt';

// 004 (page d'auteur) : title ≤ 60 et description ≤ 155 tirés de textes libres, coupés au mot.

describe('extrait borné', () => {
  it('texte court : inchangé, espaces normalisés', () => {
    expect(excerpt('  Née   à Ndangane.\n', 155)).toBe('Née à Ndangane.');
  });

  it('texte long : coupé au dernier mot entier, points de suspension compris', () => {
    const result = excerpt('Aïssatou guide les voyageurs dans les bolongs depuis vingt ans', 30);
    expect(result).toBe('Aïssatou guide les voyageurs…');
    expect(result.length).toBeLessThanOrEqual(30);
  });

  it('mot unique trop long : coupé net', () => {
    expect(excerpt('x'.repeat(40), 10)).toBe(`${'x'.repeat(9)}…`);
  });

  it('texte vide : chaîne vide', () => {
    expect(excerpt('', 60)).toBe('');
  });
});
