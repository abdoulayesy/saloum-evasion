import { expect, test } from '@playwright/test';
import { applyNetwork } from './support/network';
import { PAGE_TYPES } from './support/perf';

// T168 (spec FR-020) : en 3G sur Android 360, le H1 et le contenu principal de chaque type de
// page publique sont lisibles en 5 s au plus, et l'action principale est utilisable.
test.describe('pages publiques en 3G', () => {
  for (const { name, path } of PAGE_TYPES) {
    test(`${name} : H1 et contenu lisibles en 5 s, action principale`, async ({
      page,
      browserName,
      isMobile,
    }) => {
      test.skip(browserName !== 'chromium' || !isMobile, 'Profil 3G : Chromium mobile');
      await applyNetwork(page, '3g');
      const started = Date.now();
      await page.goto(path, { waitUntil: 'commit' });
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 5000 });
      await expect(page.locator('main p').first()).toBeVisible({ timeout: 5000 });
      expect(Date.now() - started, `${name} : lisible`).toBeLessThanOrEqual(5000);
      // Action principale : barre collante, bouton d'envoi ou lien WhatsApp (le lien WhatsApp de
      // l'en-tête n'apparaît qu'à partir de 640 px : on prend la première action visible).
      const action = page
        .locator(
          '[data-sticky-action-bar] a, form button[type="submit"], a[href^="https://wa.me/"]',
        )
        .filter({ visible: true })
        .first();
      await expect(action).toBeVisible({ timeout: 10_000 });
    });
  }
});
