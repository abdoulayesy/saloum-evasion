import { expect, test } from '@playwright/test';
import { expectIndexableBasics, jsonLdTypes, readSeo } from './support/seo';

// T109 (projet nojs) : hub et univers — ItemList, fil d'Ariane, sitemap.
const PAGES = [
  ['/fr/experiences', /\/en\/experiences$/],
  ['/fr/experiences/mangrove-et-iles', /\/en\/experiences\/mangrove-and-islands$/],
] as const;

test.describe('hub et univers — SEO', () => {
  for (const [path, english] of PAGES) {
    test(`${path} : métadonnées, hreflang, ItemList, fil d’Ariane`, async ({ page }) => {
      await page.goto(path);
      const seo = await readSeo(page);
      expectIndexableBasics(seo, path);
      expect(seo.hreflang.en).toMatch(english);
      expect(jsonLdTypes(seo)).toEqual(expect.arrayContaining(['ItemList', 'BreadcrumbList']));
      await expect(page.getByRole('navigation', { name: 'Fil d’Ariane' })).toBeVisible();
    });
  }

  test('sitemap : hub, univers et fiches', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    for (const path of [
      '/fr/experiences',
      '/en/experiences',
      '/fr/experiences/table-du-saloum',
      '/en/experiences/saloum-table',
      '/fr/experiences/mangrove-et-iles/excursion-pirogue-bolongs',
    ]) {
      expect(xml, path).toMatch(new RegExp(`<loc>[^<]+${path}</loc>`));
    }
  });
});
