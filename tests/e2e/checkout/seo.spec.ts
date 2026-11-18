import { expect, test } from '@playwright/test';
import { reachPaymentPage } from '../support/checkout';
import { uniqueName } from '../support/request';

// T043 (constitution III, FR-037) : chaque page du tunnel en `noindex` (balise et en-tête), absente
// du plan du site, avec un titre et un H1 uniques.

test.describe('référencement du tunnel @seo', () => {
  test('noindex, hors sitemap, titre et H1 uniques', async ({ page, request }) => {
    test.setTimeout(120_000);
    await reachPaymentPage(page, request, { firstName: uniqueName('Seo') });
    const titles = new Set<string>();
    for (const path of [
      '/fr/panier',
      '/fr/commande/coordonnees',
      '/fr/commande/paiement',
      '/en/cart',
    ]) {
      const response = await page.goto(path);
      expect(response?.headers()['x-robots-tag'], path).toContain('noindex');
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
      await expect(page.locator('h1')).toHaveCount(1);
      titles.add(await page.title());
    }
    expect(titles.size).toBe(4);
    const sitemap = await (await request.get('/sitemap.xml')).text();
    for (const segment of [
      '/panier',
      '/commande/',
      '/reservation/',
      '/cart',
      '/checkout/',
      '/booking/',
    ]) {
      expect(sitemap, segment).not.toContain(segment);
    }
  });
});
