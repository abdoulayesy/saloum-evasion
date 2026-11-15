import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from './support/a11y';
import { expectNoHorizontalScroll, expectTouchTargets, setTextZoom } from './support/mobile';

// T116 : page destination et liste des destinations à 360 px.
test.describe('destinations', () => {
  test('Ndangane : séjours, expériences et hébergements du lieu', async ({ page }) => {
    await page.goto('/fr/destinations/ndangane');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ndangane');
    await expect(page.getByRole('heading', { name: 'Séjours à Ndangane' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Que faire à Ndangane' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Où dormir à Ndangane' })).toBeVisible();
    await expectTouchTargets(page);
    await expectNoHorizontalScroll(page);
  });

  test('aucune section vide : l’île aux Oiseaux n’affiche ni expériences ni hébergements', async ({
    page,
  }) => {
    await page.goto('/fr/destinations/ile-aux-oiseaux');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Île aux Oiseaux');
    await expect(page.getByRole('heading', { name: /Que faire à/ })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Où dormir à/ })).toHaveCount(0);
  });

  test('barre collante « Voir les séjours à Ndangane » qui mène aux séjours du lieu', async ({
    page,
  }) => {
    await page.goto('/fr/destinations/ndangane');
    const bar = page.locator('[data-sticky-action-bar]');
    await bar.getByRole('link', { name: 'Voir les séjours à Ndangane' }).click();
    await expect(page).toHaveURL(/#sejours-du-lieu$/);
    await expect(page.getByRole('heading', { name: 'Séjours à Ndangane' })).toBeInViewport();
  });

  test('axe, zoom 200 % ; liste des destinations', async ({ page }) => {
    await page.goto('/fr/destinations/ndangane');
    await expectNoAxeViolations(page, 'destination');
    await setTextZoom(page, 2);
    await expectNoHorizontalScroll(page);
    await page.goto('/fr/destinations');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Destinations du Sine-Saloum');
    await expect(page.locator('h1 ~ ul > li')).toHaveCount(6);
    await expectNoAxeViolations(page, 'liste des destinations');
    await expectTouchTargets(page);
    await expectNoHorizontalScroll(page);
  });
});
