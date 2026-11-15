import { expect, test } from '@playwright/test';
import { expectIndexableBasics, jsonLdTypes, readSeo } from './support/seo';

// T092 (projet nojs) : liste des séjours servie sans JavaScript.
test.describe('liste des séjours — SEO', () => {
  test('métadonnées, ItemList, fil d’Ariane, toutes les fiches présentes sans JS', async ({
    page,
  }) => {
    await page.goto('/fr/sejours');
    const seo = await readSeo(page);
    expectIndexableBasics(seo, '/fr/sejours');
    expect(jsonLdTypes(seo)).toEqual(expect.arrayContaining(['ItemList', 'BreadcrumbList']));
    await expect(page.locator('[data-stay-card]')).toHaveCount(3);
    await expect(page.getByRole('navigation', { name: 'Fil d’Ariane' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Filtrer' })).toHaveCount(0);
  });

  test('canonical sans paramètres de filtre', async ({ page }) => {
    await page.goto('/fr/sejours?duree=weekend&envie=nature');
    const seo = await readSeo(page);
    expect(seo.canonical).toMatch(/\/fr\/sejours$/);
  });

  test('version anglaise et sitemap', async ({ page, request }) => {
    await page.goto('/en/stays');
    const seo = await readSeo(page);
    expectIndexableBasics(seo, '/en/stays');
    expect(seo.hreflang.fr).toMatch(/\/fr\/sejours$/);
    const xml = await (await request.get('/sitemap.xml')).text();
    expect(xml).toMatch(/<loc>[^<]+\/fr\/sejours<\/loc>/);
    expect(xml).toMatch(/<loc>[^<]+\/en\/stays<\/loc>/);
  });
});
