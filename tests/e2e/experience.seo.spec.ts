import { expect, test } from '@playwright/test';
import { expectIndexableBasics, jsonLdTypes, readSeo } from './support/seo';

// T107 (projet nojs) : fiche expérience servie sans JavaScript.
const FR = '/fr/experiences/mangrove-et-iles/excursion-pirogue-bolongs';
const EN = '/en/experiences/mangrove-and-islands/pirogue-trip-bolongs';

test.describe('fiche expérience — SEO', () => {
  test('métadonnées, hreflang réciproques, JSON-LD attraction + offre XOF', async ({ page }) => {
    await page.goto(FR);
    const fr = await readSeo(page);
    expectIndexableBasics(fr, FR);
    expect(fr.hreflang.en).toMatch(new RegExp(`${EN}$`));
    expect(jsonLdTypes(fr)).toEqual(
      expect.arrayContaining(['TouristAttraction', 'TouristTrip', 'BreadcrumbList']),
    );
    const json = JSON.stringify(fr.jsonLd);
    expect(json).toContain('"priceCurrency":"XOF"');
    expect(json).toContain('"price":15000');
    expect(json).not.toMatch(/aggregateRating|"review"/i);

    await page.goto(EN);
    const en = await readSeo(page);
    expectIndexableBasics(en, EN);
    expect(en.hreflang.fr).toMatch(new RegExp(`${FR}$`));
  });

  test('fil d’Ariane à 4 niveaux : Accueil › Expériences › Univers › Fiche', async ({ page }) => {
    await page.goto(FR);
    const items = await page
      .getByRole('navigation', { name: 'Fil d’Ariane' })
      .locator('li')
      .allTextContents();
    expect(items.map((text) => text.replace(/^\/\s*/, '').trim())).toEqual([
      'Accueil',
      'Expériences',
      'Mangrove & îles',
      'Excursion en pirogue dans les bolongs',
    ]);
  });

  test('au moins 300 mots, image de partage 1200×630', async ({ page, request }) => {
    await page.goto(FR);
    const words = await page
      .locator('main')
      .evaluate(
        (main) =>
          (main.textContent ?? '').split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length,
      );
    expect(words).toBeGreaterThanOrEqual(300);
    const image = (await readSeo(page)).og['og:image'] ?? '';
    expect(image).toMatch(/\/og\/experiences\/\d+$/);
    const response = await request.get(new URL(image).pathname);
    expect(response.headers()['content-type']).toBe('image/png');
  });
});
