import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from './support/a11y';
import {
  expectFocusNotObscured,
  expectNoHorizontalScroll,
  expectTouchTargets,
  setTextZoom,
} from './support/mobile';

// T083 : fiche séjour à 360 px (et paysage, Pixel 7, iPhone SE, ordinateur).
const STAY = '/fr/sejours/week-end-bolong-ndangane';

test.describe('fiche séjour', () => {
  test('H1, prix FCFA et équivalent indicatif, conditions d’annulation près du prix', async ({
    page,
  }) => {
    await page.goto(STAY);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Week-end bolong à Ndangane');
    await expect(page.getByText(/180\s000\sFCFA/).first()).toBeVisible();
    await expect(page.getByText(/indicatif/).first()).toBeVisible();
    await expect(page.getByText(/Conditions d’annulation :/)).toBeVisible();
    await expectTouchTargets(page);
    await expectNoHorizontalScroll(page);
  });

  test('barre collante présente au défilement sur téléphone en portrait', async ({ page }) => {
    await page.goto(STAY);
    const bar = page.locator('[data-sticky-action-bar]');
    const fixed = await bar.evaluate((element) => getComputedStyle(element).position === 'fixed');
    test.skip(!fixed, 'Barre dans le flux (ordinateur, tablette ou paysage bas)');
    await page.evaluate(() => window.scrollBy(0, 2000));
    await expect(bar).toBeInViewport();
    await expect(bar.getByRole('link', { name: /WhatsApp/ })).toHaveAttribute(
      'href',
      /^https:\/\/wa\.me\/\d+\?text=/,
    );
  });

  test('zoom à 200 % : la barre occupe au plus 25 % de la hauteur, sans défilement horizontal', async ({
    page,
  }) => {
    await page.goto(STAY);
    await setTextZoom(page, 2);
    await expectNoHorizontalScroll(page);
    // Quand elle est collée à l'écran, la barre n'en occupe jamais plus d'un quart.
    const ratio = await page.evaluate(() => {
      const bar = document.querySelector('[data-sticky-action-bar]');
      if (!bar || getComputedStyle(bar).position !== 'fixed') return 0;
      return bar.getBoundingClientRect().height / window.innerHeight;
    });
    expect(ratio).toBeLessThanOrEqual(0.25);
  });

  test('galerie : boutons et défilement au doigt mettent à jour la position', async ({ page }) => {
    await page.goto(STAY);
    const gallery = page.getByRole('region', { name: 'Galerie de photos' });
    await gallery.scrollIntoViewIfNeeded();
    await expect(page.getByText('Photo 1 sur 4')).toBeVisible();
    await page.getByRole('button', { name: 'Photo suivante' }).click();
    await expect(page.getByText('Photo 2 sur 4')).toBeVisible();
    await gallery.evaluate((element) => element.scrollTo({ left: element.scrollWidth }));
    await expect(page.getByText('Photo 4 sur 4')).toBeVisible();
  });

  test('axe : page et FAQ ouverte', async ({ page }) => {
    await page.goto(STAY);
    await expectNoAxeViolations(page, 'fiche séjour');
    const question = page.locator('details summary').first();
    await question.click();
    await expect(page.locator('details[open]').first()).toBeVisible();
    await expectNoAxeViolations(page, 'fiche séjour, FAQ ouverte');
  });

  test('clavier : le focus n’est jamais masqué par la barre collante', async ({ page }) => {
    await page.goto(STAY);
    for (let step = 0; step < 30; step += 1) {
      await page.keyboard.press('Tab');
      await expectFocusNotObscured(page);
    }
  });
});
