import { expect, test } from '@playwright/test';
import { expectIndexableBasics, jsonLdTypes, readSeo } from './support/seo';

// T117 (projet nojs) : destinations — métadonnées, JSON-LD selon le type de lieu, maillage.
test.describe('destinations — SEO', () => {
  test('village → TouristDestination avec attractions ; hreflang réciproques', async ({ page }) => {
    await page.goto('/fr/destinations/ndangane');
    const fr = await readSeo(page);
    expectIndexableBasics(fr, '/fr/destinations/ndangane');
    expect(jsonLdTypes(fr)).toEqual(
      expect.arrayContaining(['TouristDestination', 'BreadcrumbList']),
    );
    expect(JSON.stringify(fr.jsonLd)).toContain('#attraction');
    expect(fr.hreflang.en).toMatch(/\/en\/destinations\/ndangane$/);
    await page.goto('/en/destinations/ndangane');
    expect((await readSeo(page)).hreflang.fr).toMatch(/\/fr\/destinations\/ndangane$/);
  });

  test('réserve → TouristAttraction', async ({ page }) => {
    await page.goto('/fr/destinations/ile-aux-oiseaux');
    const seo = await readSeo(page);
    expectIndexableBasics(seo, '/fr/destinations/ile-aux-oiseaux');
    expect(jsonLdTypes(seo)).toContain('TouristAttraction');
    expect(jsonLdTypes(seo)).not.toContain('TouristDestination');
    expect(seo.hreflang.en).toMatch(/\/en\/destinations\/bird-island$/);
  });

  test('maillage : liens vers les séjours, expériences et hébergements du lieu', async ({
    page,
  }) => {
    await page.goto('/fr/destinations/ndangane');
    await expect(
      page.locator('a[href="/fr/sejours/week-end-bolong-ndangane"]').first(),
    ).toBeVisible();
    await expect(
      page.locator('a[href="/fr/experiences/mangrove-et-iles/excursion-pirogue-bolongs"]').first(),
    ).toBeVisible();
    await expect(
      page.locator('a[href="/fr/hebergements/villa-piscine-ndangane"]').first(),
    ).toBeVisible();
  });

  test('liste : ItemList et fil d’Ariane ; sitemap', async ({ page, request }) => {
    await page.goto('/fr/destinations');
    const seo = await readSeo(page);
    expectIndexableBasics(seo, '/fr/destinations');
    expect(jsonLdTypes(seo)).toEqual(expect.arrayContaining(['ItemList', 'BreadcrumbList']));
    const xml = await (await request.get('/sitemap.xml')).text();
    for (const path of [
      '/fr/destinations',
      '/en/destinations',
      '/fr/destinations/mar-lodj',
      '/en/destinations/bird-island',
    ]) {
      expect(xml, path).toMatch(new RegExp(`<loc>[^<]+${path}</loc>`));
    }
  });
});
