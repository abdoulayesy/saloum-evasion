import { describe, expect, it } from 'vitest';
import { readingMinutes, WORDS_PER_MINUTE } from '@/lib/guides/readingTime';

// T012 (004, research R6) : 200 mots par minute, arrondi au supérieur, minimum 1.

const body = (words: number) => ({
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: Array.from({ length: words }, () => 'mot').join(' ') }],
      },
    ],
  },
});

describe('temps de lecture', () => {
  it('200 mots par minute, arrondi au supérieur', () => {
    expect(WORDS_PER_MINUTE).toBe(200);
    expect(readingMinutes(body(200))).toBe(1);
    expect(readingMinutes(body(201))).toBe(2);
    expect(readingMinutes(body(1_000))).toBe(5);
  });

  it('au moins une minute, même pour un corps court ou vide', () => {
    expect(readingMinutes(body(10))).toBe(1);
    expect(readingMinutes(null)).toBe(1);
  });
});
