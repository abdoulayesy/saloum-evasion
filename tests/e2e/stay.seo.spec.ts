import { expect, test } from '@playwright/test';
import { expectIndexableBasics, jsonLdTypes, readSeo } from './support/seo';

// T084 (projet nojs) : fiche séjour servie sans JavaScript, prête pour l'indexation.
const FR = '/fr/sejours/week-end-bolong-ndangane';
const EN = '/en/stays/bolong-weekend-ndangane';

test.describe('fiche séjour — SEO', () => {
  test('métadonnées, canonical, hreflang réciproques, index', async ({ page }) => {
    await page.goto(FR);
    const fr = await readSeo(page);
    expectIndexableBasics(fr, FR);
    expect(fr.canonical).toMatch(new RegExp(`${FR}$`));
    expect(fr.hreflang.en).toMatch(new RegExp(`${EN}$`));
    expect(fr.hreflang['x-default']).toMatch(new RegExp(`${FR}$`));

    await page.goto(EN);
    const en = await readSeo(page);
    expectIndexableBasics(en, EN);
    expect(en.hreflang.fr).toMatch(new RegExp(`${FR}$`));
    expect(await page.locator('html').getAttribute('lang')).toBe('en');
  });

  test('JSON-LD : TouristTrip, BreadcrumbList, FAQPage ; fil d’Ariane identique au visible', async ({
    page,
  }) => {
    await page.goto(FR);
    const seo = await readSeo(page);
    expect(jsonLdTypes(seo)).toEqual(
      expect.arrayContaining(['TravelAgency', 'TouristTrip', 'BreadcrumbList', 'FAQPage']),
    );
    const json = JSON.stringify(seo.jsonLd);
    expect(json).toContain('"priceCurrency":"XOF"');
    expect(json).not.toMatch(/aggregateRating|"review"/i);
    const visible = await page
      .getByRole('navigation', { name: 'Fil d’Ariane' })
      .locator('li')
      .allTextContents();
    const breadcrumb = await page.evaluate(() => {
      for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
        const graph: unknown = JSON.parse(script.textContent ?? '{}');
        const nodes =
          typeof graph === 'object' && graph && '@graph' in graph && Array.isArray(graph['@graph'])
            ? graph['@graph']
            : [];
        const list = nodes.find((node: { '@type'?: string }) => node['@type'] === 'BreadcrumbList');
        if (list) return list.itemListElement.map((item: { name: string }) => item.name);
      }
      return [];
    });
    expect(breadcrumb).toEqual(visible.map((text) => text.replace(/^\/\s*/, '').trim()));
  });

  test('contenu indexable : au moins 300 mots dans le contenu principal', async ({ page }) => {
    await page.goto(FR);
    const words = await page
      .locator('main')
      .evaluate(
        (main) =>
          (main.textContent ?? '').split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length,
      );
    expect(words).toBeGreaterThanOrEqual(300);
  });

  test('image de partage 1200×630 accessible', async ({ page, request }) => {
    await page.goto(FR);
    const seo = await readSeo(page);
    const image = seo.og['og:image'] ?? '';
    expect(image).toMatch(/\/og\/stays\/\d+$/);
    const response = await request.get(new URL(image).pathname);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('image/png');
    const png = await response.body();
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  });

  test('présente dans le sitemap avec ses alternatives', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    expect(xml).toMatch(new RegExp(`<loc>[^<]+${FR}</loc>`));
    expect(xml).toMatch(new RegExp(`<loc>[^<]+${EN}</loc>`));
    expect(xml).toContain('<image:loc>');
  });
});
