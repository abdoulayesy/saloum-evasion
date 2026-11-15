import { describe, expect, it } from 'vitest';
import { selectSimilarStays } from '@/lib/similarStays';
import { lexicalToPlainText } from '@/lib/richText';

const current = { id: 1, destinationIds: [10], moods: ['nature', 'detente'], featured: false };
const candidates = [
  current,
  { id: 2, destinationIds: [20], moods: ['nature', 'detente'], featured: true },
  { id: 3, destinationIds: [10], moods: [], featured: false },
  { id: 4, destinationIds: [30], moods: ['nature'], featured: false },
  { id: 5, destinationIds: [30], moods: [], featured: true },
];

describe('séjours similaires', () => {
  it('même destination, puis envies communes, puis mis en avant ; 3 maximum, jamais le séjour courant', () => {
    expect(selectSimilarStays(current, candidates).map((s) => s.id)).toEqual([3, 2, 4]);
  });
  it('choix manuel de l’éditeur prioritaire', () => {
    expect(selectSimilarStays(current, candidates, [5, 1, 99]).map((s) => s.id)).toEqual([5]);
  });
});

describe('texte brut du texte riche', () => {
  it('concatène les blocs avec des espaces', () => {
    const state = {
      root: {
        type: 'root',
        children: [
          { type: 'paragraph', children: [{ type: 'text', text: 'Bonjour.' }] },
          {
            type: 'paragraph',
            children: [
              { type: 'text', text: 'Le Saloum' },
              { type: 'text', text: ' vous attend.' },
            ],
          },
        ],
      },
    };
    expect(lexicalToPlainText(state)).toBe('Bonjour. Le Saloum vous attend.');
    expect(lexicalToPlainText(null)).toBe('');
  });
});
