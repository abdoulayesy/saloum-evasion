import { describe, expect, it } from 'vitest';
import {
  encodeCartSummary,
  hashCartToken,
  isCartToken,
  newCartToken,
  parseCartSummary,
} from '@/lib/cart/cookies';
import { cartSummary } from '@/lib/cart/repository';

// T032 : jeton du panier (128 bits, empreinte stockée) et résumé lisible sans donnée personnelle.
describe('cookies du panier', () => {
  it('jeton aléatoire de 128 bits en base64url, jamais deux fois le même', () => {
    const tokens = new Set(Array.from({ length: 1000 }, newCartToken));
    expect(tokens.size).toBe(1000);
    for (const token of tokens) expect(isCartToken(token)).toBe(true);
  });

  it('jetons mal formés refusés avant toute requête', () => {
    expect(isCartToken(undefined)).toBe(false);
    expect(isCartToken('court')).toBe(false);
    expect(isCartToken("' OR 1=1 --xxxxxxxxxxxx")).toBe(false);
  });

  it('empreinte SHA-256 stable, différente du jeton', () => {
    const token = newCartToken();
    expect(hashCartToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashCartToken(token)).toBe(hashCartToken(token));
    expect(hashCartToken(token)).not.toContain(token);
  });

  it('résumé « nombre.total » : aller-retour, valeurs invalides ignorées', () => {
    expect(encodeCartSummary({ count: 3, total: 487_350 })).toBe('3.487350');
    expect(parseCartSummary('3.487350')).toEqual({ count: 3, total: 487_350 });
    expect(parseCartSummary('0.0')).toBeNull();
    expect(parseCartSummary('abc')).toBeNull();
    expect(parseCartSummary(undefined)).toBeNull();
  });

  it('résumé calculé sur les totaux vus à l’ajout', () => {
    expect(cartSummary({ items: [] })).toEqual({ count: 0, total: 0 });
    expect(
      cartSummary({
        items: [
          {
            lineId: 'a',
            offerType: 'experience',
            offer: { relationTo: 'experiences', value: 1 },
            startDate: '2027-02-11',
            adults: 2,
            children: 0,
            infants: 0,
            quotedUnitPrice: 25_000,
            quotedTotal: 50_000,
          },
          {
            lineId: 'b',
            offerType: 'transfer',
            offer: { relationTo: 'transfers', value: 1 },
            startDate: '2027-02-10',
            adults: 2,
            children: 0,
            infants: 0,
            quotedUnitPrice: 45_000,
            quotedTotal: 45_000,
          },
        ],
      }),
    ).toEqual({ count: 2, total: 95_000 });
  });
});
