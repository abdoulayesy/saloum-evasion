import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from './support/a11y';
import { expectNoHorizontalScroll, expectTouchTargets, setTextZoom } from './support/mobile';

// T120 : fiche hébergement et liste des hébergements à 360 px.
const VILLA = '/fr/hebergements/villa-piscine-ndangane';

test.describe('hébergements', () => {
  test('fiche : capacité, prix par nuit, équipements, lien vers la destination', async ({
    page,
  }) => {
    await page.goto(VILLA);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Villa avec piscine à Ndangane',
    );
    await expect(page.getByText('Jusqu’à 8 personnes').first()).toBeVisible();
    await expect(page.getByText(/120\s000\sFCFA/).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Équipements' })).toBeVisible();
    await expect(page.getByText('Piscine', { exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Ndangane', exact: true }).first().click();
    await expect(page).toHaveURL(/\/fr\/destinations\/ndangane$/);
  });

  test('fiche : axe, cibles, zoom 200 %', async ({ page }) => {
    // axe + mesures tactiles + zoom sur la page la plus lourde : dépassait 30 s au démarrage à froid.
    test.slow();
    await page.goto(VILLA);
    await expectNoAxeViolations(page, 'fiche hébergement');
    await expectTouchTargets(page);
    await expectNoHorizontalScroll(page);
    await setTextZoom(page, 2);
    await expectNoHorizontalScroll(page);
  });

  test('liste : groupes par type et puces qui y mènent', async ({ page }) => {
    test.slow();
    await page.goto('/fr/hebergements');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hébergements');
    const nav = page.getByRole('navigation', { name: 'Types d’hébergement' });
    await expect(nav.getByRole('link')).toHaveCount(3);
    await nav.getByRole('link', { name: /Campements/ }).click();
    await expect(page).toHaveURL(/#type-campement$/);
    await expect(page.getByRole('heading', { name: 'Campements', level: 2 })).toBeInViewport();
    await expectNoAxeViolations(page, 'liste des hébergements');
    await expectTouchTargets(page);
    await expectNoHorizontalScroll(page);
  });
});
