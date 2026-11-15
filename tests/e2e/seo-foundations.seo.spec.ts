import { expect, test } from '@playwright/test';
import { expectIndexableBasics, jsonLdTypes, readSeo } from './support/seo';

// T040 (projet nojs) : fondations SEO servies sans JavaScript.
test.describe('fondations SEO', () => {
  test('/ → 301 /fr en un seul saut', async ({ request }) => {
    const response = await request.get('/', { maxRedirects: 0 });
    expect(response.status()).toBe(301);
    expect(new URL(response.headers().location ?? '', 'http://x').pathname).toBe('/fr');
  });

  test('barre oblique finale et majuscules → 301 vers la forme canonique', async ({ request }) => {
    for (const [from, to] of [
      ['/fr/', '/fr'],
      ['/FR', '/fr'],
      ['/EN/', '/en'],
    ] as const) {
      const response = await request.get(from, { maxRedirects: 0 });
      expect(response.status(), from).toBe(301);
      expect(new URL(response.headers().location ?? '', 'http://x').pathname, from).toBe(to);
    }
  });

  test('robots.txt conforme au contrat', async ({ request }) => {
    const body = await (await request.get('/robots.txt')).text();
    expect(body).toContain('User-Agent: *');
    expect(body).toContain('Disallow: /admin');
    expect(body).toContain('Disallow: /api');
    expect(body).not.toContain('Disallow: /fr/demande');
    expect(body).toMatch(/Sitemap: https?:\/\/[^\s]+\/sitemap\.xml/);
  });

  test('sitemap.xml : XML valide, hreflang, aucune page noindex', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.headers()['content-type']).toContain('xml');
    const xml = await response.text();
    expect(xml.startsWith('<?xml')).toBe(true);
    expect(xml).toContain('<urlset');
    expect(xml).toMatch(/<loc>[^<]+\/fr<\/loc>/);
    expect(xml).toMatch(/<loc>[^<]+\/en<\/loc>/);
    expect(xml).toContain('hreflang="x-default"');
    expect(xml).not.toMatch(/\/(demande|request|mentions-legales|legal-notice)</);
  });

  for (const [path, lang, other] of [
    ['/fr', 'fr-SN', 'en'],
    ['/en', 'en', 'fr'],
  ] as const) {
    test(`${path} : langue, lien d’évitement, métadonnées, hreflang, JSON-LD`, async ({ page }) => {
      await page.goto(path);
      expect(await page.locator('html').getAttribute('lang')).toBe(lang);
      await expect(page.locator('a.skip-link[href="#contenu"]')).toHaveCount(1);
      await expect(page.locator('main#contenu')).toHaveCount(1);
      const seo = await readSeo(page);
      expectIndexableBasics(seo, path);
      expect(seo.canonical).toMatch(new RegExp(`${path}$`));
      expect(seo.hreflang[other]).toMatch(new RegExp(`/${other}$`));
      expect(seo.hreflang['x-default']).toMatch(/\/fr$/);
      expect(seo.og['og:image']).toMatch(/\/og-default\.png$/);
      expect(jsonLdTypes(seo)).toEqual(expect.arrayContaining(['TravelAgency', 'WebSite']));
      expect(JSON.stringify(seo.jsonLd)).not.toMatch(/aggregateRating|"review"/i);
    });
  }

  test('image de partage par défaut : PNG 1200×630', async ({ request }) => {
    const response = await request.get('/og-default.png');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('image/png');
    const png = await response.body();
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  });

  test('menu sans JavaScript : le bouton mène à la navigation du pied de page', async ({
    page,
  }) => {
    await page.goto('/fr');
    await expect(page.getByRole('link', { name: 'Menu' })).toHaveAttribute(
      'href',
      '#navigation-pied',
    );
    await expect(page.locator('#navigation-pied')).toHaveCount(1);
  });
});
