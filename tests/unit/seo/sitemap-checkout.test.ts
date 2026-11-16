import { describe, expect, it } from 'vitest';
import robots from '@/app/robots';
import { checkoutPath, internalCheckoutPath, isTunnelPath } from '@/lib/checkout/paths';
import { entriesForRoute, fixedEntries } from '@/lib/seo/sitemapEntries';

// T035 : pages du tunnel absentes du sitemap, jamais bloquées par robots.txt (Google doit pouvoir
// lire leur `noindex`).
describe('tunnel, sitemap et robots.txt', () => {
  it('reconnaît toutes les URL du tunnel, publiques et internes', () => {
    expect(isTunnelPath(checkoutPath('fr', 'cart'))).toBe(true);
    expect(isTunnelPath(checkoutPath('en', 'details'))).toBe(true);
    expect(isTunnelPath(checkoutPath('fr', 'balance', 'SE-AB23CD'))).toBe(true);
    expect(isTunnelPath(internalCheckoutPath('fr', 'status'))).toBe(true);
    expect(isTunnelPath('/fr/sejours')).toBe(false);
    expect(isTunnelPath('/fr')).toBe(false);
  });

  it('une route du tunnel ne produit aucune entrée de sitemap', () => {
    expect(entriesForRoute({ fr: '/fr/panier', en: '/en/cart' })).toEqual([]);
    expect(entriesForRoute({ fr: '/fr/sejours', en: '/en/stays' })).toHaveLength(2);
  });

  it('aucune page fixe du sitemap n’appartient au tunnel', () => {
    for (const entry of fixedEntries()) {
      expect(isTunnelPath(new URL(entry.url).pathname)).toBe(false);
    }
  });

  it('robots.txt ne bloque pas le tunnel', () => {
    const rules = robots().rules;
    const list = Array.isArray(rules) ? rules : [rules];
    const disallowed = list.flatMap((rule) =>
      rule.disallow === undefined
        ? []
        : Array.isArray(rule.disallow)
          ? rule.disallow
          : [rule.disallow],
    );
    for (const path of [
      checkoutPath('fr', 'cart'),
      checkoutPath('en', 'payment'),
      checkoutPath('fr', 'find'),
    ]) {
      expect(disallowed.some((prefix) => path.startsWith(prefix))).toBe(false);
    }
  });
});
