import { expect, test } from '@playwright/test';
import { expectIndexableBasics, jsonLdTypes, readSeo } from './support/seo';

// T024 (004, projet nojs) : guides et pages d'auteur servis sans JavaScript — contenu,
// signature, métadonnées, hreflang seulement si la version existe, JSON-LD Article,
// BreadcrumbList, FAQPage, ProfilePage.

const GUIDE = '/fr/carnets-du-saloum/guide-de-demonstration';
const GUIDE_FR_ONLY = '/fr/carnets-du-saloum/guide-de-demonstration-francais';
const AUTHOR = '/fr/equipe/membre-demo-1';

test.describe('Carnets du Saloum — SEO @guides', () => {
  test('guide : contenu sans JS, Article signé, fil d’Ariane, FAQ, hreflang réciproques', async ({
    page,
  }) => {
    await page.goto(GUIDE);
    await expect(page.getByText('Les bolongs sont des bras de mer')).toBeVisible();
    await expect(page.locator('h2#les-bolongs-en-pirogue')).toBeVisible();
    const seo = await readSeo(page);
    expectIndexableBasics(seo, GUIDE);
    expect(jsonLdTypes(seo)).toEqual(
      expect.arrayContaining(['Article', 'BreadcrumbList', 'FAQPage']),
    );
    const graph = JSON.stringify(seo.jsonLd);
    expect(graph).toContain(`${AUTHOR}#person`);
    expect(graph).toContain('"dateModified"');
    expect(graph).not.toContain('aggregateRating');
    expect(seo.og['og:type']).toBe('article');
    expect(seo.hreflang.en).toMatch(/\/en\/saloum-travel-guides\/demonstration-guide$/);
    await page.goto('/en/saloum-travel-guides/demonstration-guide');
    expect((await readSeo(page)).hreflang.fr).toMatch(new RegExp(`${GUIDE}$`));
  });

  test('guide en français seulement : aucune version anglaise annoncée', async ({ page }) => {
    await page.goto(GUIDE_FR_ONLY);
    const seo = await readSeo(page);
    expectIndexableBasics(seo, GUIDE_FR_ONLY);
    expect(seo.hreflang.en).toBeUndefined();
    expect(jsonLdTypes(seo)).not.toContain('FAQPage');
    const english = await page.goto('/en/saloum-travel-guides/guide-de-demonstration-francais');
    expect(english?.status()).toBe(404);
  });

  // T056 (US4) : rubrique servie sans JavaScript.
  test('rubrique : CollectionPage + ItemList des guides, hreflang réciproques', async ({
    page,
  }) => {
    await page.goto('/fr/carnets-du-saloum');
    const seo = await readSeo(page);
    expectIndexableBasics(seo, '/fr/carnets-du-saloum');
    expect(jsonLdTypes(seo)).toEqual(
      expect.arrayContaining(['CollectionPage', 'ItemList', 'BreadcrumbList']),
    );
    expect(JSON.stringify(seo.jsonLd)).toContain(GUIDE);
    expect(seo.hreflang.en).toMatch(/\/en\/saloum-travel-guides$/);
    await expect(page.locator(`a[href="${GUIDE}"]`)).toBeVisible();
  });

  test('page d’auteur : ProfilePage, Person reprise par les articles', async ({ page }) => {
    await page.goto(AUTHOR);
    const seo = await readSeo(page);
    expectIndexableBasics(seo, AUTHOR);
    expect(jsonLdTypes(seo)).toEqual(expect.arrayContaining(['ProfilePage', 'BreadcrumbList']));
    expect(JSON.stringify(seo.jsonLd)).toContain(`${AUTHOR}#person`);
  });
});
