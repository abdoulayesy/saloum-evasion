import { expect, test } from '@playwright/test';
import { expectIndexableBasics, jsonLdTypes, readSeo } from './support/seo';

// T098 (projet nojs) : accueil servi sans JavaScript.
test.describe('accueil — SEO', () => {
  for (const [path, other] of [
    ['/fr', 'en'],
    ['/en', 'fr'],
  ] as const) {
    test(`${path} : métadonnées, hreflang, Organization + WebSite, H1 unique`, async ({ page }) => {
      await page.goto(path);
      const seo = await readSeo(page);
      expectIndexableBasics(seo, path);
      expect(seo.hreflang[other]).toMatch(new RegExp(`/${other}$`));
      expect(jsonLdTypes(seo)).toEqual(expect.arrayContaining(['TravelAgency', 'WebSite']));
      expect(seo.h1).toHaveLength(1);
      await expect(page.locator('form[method="get"] input[type="date"]').first()).toBeVisible();
      await expect(page.locator('[data-stay-card]').first()).toBeVisible();
    });
  }
});
