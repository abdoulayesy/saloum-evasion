import { expect, test } from '@playwright/test';
import { expectIndexableBasics, jsonLdTypes, readSeo } from './support/seo';

// T121 (projet nojs) : hébergements — métadonnées, JSON-LD LodgingBusiness, liste, sitemap.
const FR = '/fr/hebergements/villa-piscine-ndangane';
const EN = '/en/accommodation/ndangane-villa-with-pool';

test.describe('hébergements — SEO', () => {
  test('fiche : métadonnées, hreflang, LodgingBusiness relié à sa destination', async ({
    page,
  }) => {
    await page.goto(FR);
    const fr = await readSeo(page);
    expectIndexableBasics(fr, FR);
    expect(fr.hreflang.en).toMatch(new RegExp(`${EN}$`));
    // Villa du seed sans identifiant ni chambres : pas éligible à VacationRental.
    expect(jsonLdTypes(fr)).toEqual(expect.arrayContaining(['LodgingBusiness', 'BreadcrumbList']));
    const json = JSON.stringify(fr.jsonLd);
    expect(json).toContain('/fr/destinations/ndangane#place');
    expect(json).toContain('"maximumAttendeeCapacity":8');
    expect(json).not.toMatch(/aggregateRating|"review"/i);
    await page.goto(EN);
    expectIndexableBasics(await readSeo(page), EN);
  });

  test('liste : ItemList, fil d’Ariane, sitemap', async ({ page, request }) => {
    await page.goto('/fr/hebergements');
    const seo = await readSeo(page);
    expectIndexableBasics(seo, '/fr/hebergements');
    expect(jsonLdTypes(seo)).toEqual(expect.arrayContaining(['ItemList', 'BreadcrumbList']));
    expect(seo.hreflang.en).toMatch(/\/en\/accommodation$/);
    const xml = await (await request.get('/sitemap.xml')).text();
    for (const path of ['/fr/hebergements', '/en/accommodation', FR, EN]) {
      expect(xml, path).toMatch(new RegExp(`<loc>[^<]+${path}</loc>`));
    }
  });
});
