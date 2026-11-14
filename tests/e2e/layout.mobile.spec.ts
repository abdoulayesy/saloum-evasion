import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from './support/a11y';
import { expectNoHorizontalScroll, expectTouchTargets } from './support/mobile';

// T028 à T030 : en-tête, menu plein écran (<dialog>) et pied de page à 360 px.
test.describe('layout public', () => {
  test('menu plein écran : ouverture, accessibilité, fermeture en bas', async ({ page }) => {
    await page.goto('/fr');
    const opener = page.getByRole('link', { name: 'Menu' });
    await opener.click();
    const dialog = page.getByRole('dialog', { name: 'Menu' });
    await expect(dialog).toBeVisible();
    await expectNoAxeViolations(page, 'menu ouvert');
    await expectTouchTargets(page);
    await dialog.getByRole('button', { name: 'Fermer le menu' }).last().click();
    await expect(dialog).toBeHidden();
  });

  test('menu : Échap ferme et rend le focus au bouton', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Clavier physique');
    await page.goto('/fr');
    const opener = page.getByRole('link', { name: 'Menu' });
    await opener.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test('pied de page : trois moyens de paiement au même rang', async ({ page }) => {
    await page.goto('/fr');
    const methods = page.getByRole('contentinfo').locator('#pied-paiement + ul > li');
    await expect(methods).toHaveText(['Wave', 'Orange Money', 'Carte bancaire']);
    const boxes = await Promise.all((await methods.all()).map(async (item) => item.boundingBox()));
    const heights = boxes.map((box) => Math.round(box?.height ?? 0));
    const widths = boxes.map((box) => Math.round(box?.width ?? 0));
    const tops = boxes.map((box) => Math.round(box?.y ?? 0));
    expect(new Set(heights).size).toBe(1);
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1);
    expect(new Set(tops).size).toBe(1);
  });

  test('en-tête : lien vers l’autre langue, pas de débordement à 360 px', async ({ page }) => {
    await page.goto('/fr');
    await expect(page.getByRole('link', { name: 'EN, English version' })).toHaveAttribute(
      'href',
      '/en',
    );
    await expectNoHorizontalScroll(page);
    await page.goto('/en');
    await expect(page.getByRole('link', { name: 'FR, version française' })).toHaveAttribute(
      'href',
      '/fr',
    );
  });
});
