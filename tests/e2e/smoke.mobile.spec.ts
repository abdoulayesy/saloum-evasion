import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from './support/a11y';
import { expectNoHorizontalScroll, expectTouchTargets, setTextZoom } from './support/mobile';

test.describe('socle — page témoin', () => {
  for (const path of ['/fr', '/en']) {
    test(`${path} : axe, cibles tactiles, pas de défilement horizontal`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expectNoAxeViolations(page, path);
      await expectTouchTargets(page);
      await expectNoHorizontalScroll(page);
    });
  }

  test('zoom du texte à 200 % : aucun défilement horizontal', async ({ page }) => {
    await page.goto('/fr');
    await setTextZoom(page, 2);
    await expectNoHorizontalScroll(page);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('lien d’évitement atteignable au clavier', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Navigation clavier testée sur les projets avec clavier physique');
    await page.goto('/fr');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Aller au contenu' })).toBeFocused();
  });
});
