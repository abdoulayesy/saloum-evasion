import { expect, test } from '@playwright/test';
import { readSeo } from './support/seo';

// Projet `nojs` : le DOM est le HTML servi par le serveur (constitution III).
test.describe('socle — HTML servi sans JavaScript', () => {
  test('/fr : contenu, langue et méta présents sans JS', async ({ page }) => {
    await page.goto('/fr');
    const seo = await readSeo(page);
    expect(await page.locator('html').getAttribute('lang')).toBe('fr-SN');
    expect(seo.h1).toHaveLength(1);
    expect(seo.h1[0]).toContain('Saloum');
    expect(seo.title.length).toBeGreaterThan(0);
    expect(seo.title.length).toBeLessThanOrEqual(60);
    expect(seo.description.length).toBeLessThanOrEqual(155);
  });

  test('/en : langue anglaise', async ({ page }) => {
    await page.goto('/en');
    expect(await page.locator('html').getAttribute('lang')).toBe('en');
  });

  test('locale inconnue → 404', async ({ page }) => {
    const response = await page.goto('/es');
    expect(response?.status()).toBe(404);
  });
});
