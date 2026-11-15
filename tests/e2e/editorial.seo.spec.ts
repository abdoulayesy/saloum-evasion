import { expect, test } from '@playwright/test';
import { expectIndexableBasics, jsonLdTypes, readSeo } from './support/seo';

// T137 (projet nojs) : pages institutionnelles — métadonnées, types JSON-LD, FAQPage,
// mentions légales en noindex et hors sitemap, coordonnées identiques partout.
const INDEXABLE = [
  { fr: '/fr/notre-engagement', en: '/en/our-commitment', type: 'AboutPage' },
  { fr: '/fr/a-propos', en: '/en/about', type: 'AboutPage' },
  { fr: '/fr/faq', en: '/en/faq', type: 'WebPage' },
  { fr: '/fr/contact', en: '/en/contact', type: 'ContactPage' },
  { fr: '/fr/confidentialite', en: '/en/privacy', type: 'WebPage' },
] as const;

test.describe('pages institutionnelles — SEO', () => {
  for (const { fr, en, type } of INDEXABLE) {
    test(`${fr} : métadonnées, hreflang, ${type}`, async ({ page }) => {
      await page.goto(fr);
      const seo = await readSeo(page);
      expectIndexableBasics(seo, fr);
      expect(seo.hreflang.en).toMatch(new RegExp(`${en}$`));
      expect(jsonLdTypes(seo)).toEqual(expect.arrayContaining([type, 'BreadcrumbList']));
      await page.goto(en);
      expectIndexableBasics(await readSeo(page), en);
    });
  }

  test('FAQ : FAQPage avec exactement les questions visibles', async ({ page }) => {
    await page.goto('/fr/faq');
    const seo = await readSeo(page);
    expect(jsonLdTypes(seo)).toContain('FAQPage');
    const questions = (JSON.stringify(seo.jsonLd).match(/"@type":"Question"/g) ?? []).length;
    expect(questions).toBeGreaterThan(0);
    await expect(page.locator('details summary')).toHaveCount(questions);
  });

  test('mentions légales : noindex, sans canonical, hors sitemap', async ({ page, request }) => {
    await page.goto('/fr/mentions-legales');
    const seo = await readSeo(page);
    expect(seo.robots ?? '').toContain('noindex');
    expect(seo.canonical).toBeNull();
    const xml = await (await request.get('/sitemap.xml')).text();
    expect(xml).not.toContain('mentions-legales');
    expect(xml).not.toContain('legal-notice');
    for (const path of ['/fr/notre-engagement', '/en/about', '/fr/faq', '/fr/film-immersion']) {
      expect(xml, path).toMatch(new RegExp(`<loc>[^<]+${path}</loc>`));
    }
  });

  test('coordonnées identiques : pied de page, page contact et JSON-LD', async ({ page }) => {
    await page.goto('/fr/contact');
    const footer = (await page.locator('footer address').innerText()).replace(/\s+/g, ' ');
    const contact = (await page.locator('main address').innerText()).replace(/\s+/g, ' ');
    expect(footer).toContain('Ndangane, Fatick');
    expect(contact).toContain('Ndangane, Fatick');
    const json = JSON.stringify((await readSeo(page)).jsonLd);
    expect(json).toContain('"addressLocality":"Ndangane"');
    expect(json).toContain('"addressRegion":"Fatick"');
  });
});
