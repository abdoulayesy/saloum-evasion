import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { addAccommodation, bookableAccommodationPath, readCartSummary } from '../support/checkout';

/** Lien de langue de l'en-tête (ou du menu mobile), qui conserve la page via le Referer. */
const switchLanguage = async (page: Page, name: RegExp) => {
  const link = page.getByRole('link', { name }).first();
  if (await link.isVisible()) {
    await link.click();
    return;
  }
  await page.getByRole('button', { name: /Menu/ }).first().click();
  await page.getByRole('link', { name }).last().click();
};

// T037 (FR-003) : changer de langue en cours de parcours conserve le panier et l'étape.
test.describe('tunnel bilingue @checkout', () => {
  test('changement de langue au panier puis aux coordonnées', async ({ page, request }) => {
    test.setTimeout(120_000);
    await page.goto(await bookableAccommodationPath(request));
    await addAccommodation(page, 40, 2);
    const summary = await readCartSummary(page);
    expect(summary).toMatch(/^1\.\d+$/);

    await switchLanguage(page, /English version/);
    await expect(page).toHaveURL(/\/en\/cart/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your cart');
    await expect(page.locator('main li h2')).toHaveCount(1);

    await page.getByRole('link', { name: 'Continue: my details' }).click();
    await expect(page).toHaveURL(/\/en\/checkout\/details$/);
    await switchLanguage(page, /version française/);
    await expect(page).toHaveURL(/\/fr\/commande\/coordonnees/);
    expect(await readCartSummary(page)).toBe(summary);
  });
});
