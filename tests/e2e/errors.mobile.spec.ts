import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from './support/a11y';
import { expectNoHorizontalScroll, expectTouchTargets } from './support/mobile';

// T039 : 404 utile, statut correct, noindex, ni canonical ni hreflang, accessible à 360 px.
const cases = [
  { path: '/fr/page-qui-n-existe-pas', heading: 'Page introuvable', home: 'Retour à l’accueil' },
  { path: '/en/missing-page', heading: 'Page not found', home: 'Back to home' },
  { path: '/fr/sejours/inconnu', heading: 'Page introuvable', home: 'Retour à l’accueil' },
  { path: '/es', heading: 'Page introuvable', home: 'Retour à l’accueil' },
];

test.describe('pages d’erreur', () => {
  for (const { path, heading, home } of cases) {
    test(`${path} → 404 localisée`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
        'content',
        /noindex/,
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
      await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
      await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
      await expect(page.getByRole('link', { name: home })).toBeVisible();
      await expectNoAxeViolations(page, `404 ${path}`);
      await expectTouchTargets(page);
      await expectNoHorizontalScroll(page);
    });
  }
});
