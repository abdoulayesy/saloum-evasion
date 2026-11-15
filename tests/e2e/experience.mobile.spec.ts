import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from './support/a11y';
import { expectNoHorizontalScroll, expectTouchTargets, setTextZoom } from './support/mobile';

// T106 : fiche expérience — l'essentiel (durée, niveau, saison, départ, prix) dans le premier
// écran à 360 × 800 (mobile CHK003).
const EXPERIENCE = '/fr/experiences/mangrove-et-iles/excursion-pirogue-bolongs';

test.describe('fiche expérience', () => {
  test('faits clés et prix visibles dans le premier écran', async ({ page }) => {
    await page.goto(EXPERIENCE);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Excursion en pirogue dans les bolongs',
    );
    const facts = page.locator('section[aria-labelledby="essentiel"]');
    for (const label of ['Durée', 'Niveau', 'Saison', 'Départ']) {
      await expect(facts.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(facts.getByText('Toute l’année')).toBeVisible();
    const price = facts.getByText(/15\s000\sFCFA/);
    await expect(price).toBeVisible();
    const viewport = page.viewportSize();
    const box = await price.boundingBox();
    if (viewport && viewport.width <= 414 && viewport.height >= 700) {
      expect((box?.y ?? Infinity) + (box?.height ?? 0)).toBeLessThanOrEqual(viewport.height);
    }
  });

  test('axe, cibles tactiles, pas de défilement horizontal, zoom 200 %', async ({ page }) => {
    await page.goto(EXPERIENCE);
    await expectNoAxeViolations(page, 'fiche expérience');
    await expectTouchTargets(page);
    await expectNoHorizontalScroll(page);
    await setTextZoom(page, 2);
    await expectNoHorizontalScroll(page);
  });

  test('version anglaise', async ({ page }) => {
    await page.goto('/en/experiences/mangrove-and-islands/pirogue-trip-bolongs');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Pirogue trip through the bolongs',
    );
    await expect(page.getByText('All year round')).toBeVisible();
  });

  test('univers erroné dans l’URL : 404', async ({ page }) => {
    const response = await page.goto('/fr/experiences/terre-et-villages/excursion-pirogue-bolongs');
    expect(response?.status()).toBe(404);
  });
});
