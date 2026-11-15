import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from './support/a11y';
import { expectNoHorizontalScroll, expectTouchTargets, setTextZoom } from './support/mobile';

// T091 : liste des séjours et panneau de filtres qui monte du bas.
const LIST = '/fr/sejours';

const visibleCards = (page: import('@playwright/test').Page) =>
  page.locator('li:not([hidden]) > [data-stay-card]');

test.describe('liste des séjours', () => {
  test('liste complète, cibles tactiles, pas de défilement horizontal', async ({ page }) => {
    await page.goto(LIST);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Séjours signature');
    await expect(visibleCards(page)).toHaveCount(3);
    await expect(page.locator('#resultats-nombre')).toHaveText('3 séjours');
    await expectTouchTargets(page);
    await expectNoHorizontalScroll(page);
  });

  test('panneau : ouverture, filtre, nombre mis à jour, axe panneau ouvert', async ({ page }) => {
    await page.goto(LIST);
    await page.getByRole('button', { name: 'Filtrer' }).click();
    const sheet = page.getByRole('dialog', { name: 'Filtrer les séjours' });
    await expect(sheet).toBeVisible();
    await expectNoAxeViolations(page, 'panneau de filtres ouvert');
    await sheet.getByRole('button', { name: 'Week-end (1 à 2 nuits)' }).click();
    await expect(sheet.getByRole('button', { name: 'Voir 1 séjour' })).toBeVisible();
    await sheet.getByRole('button', { name: 'Voir 1 séjour' }).click();
    await expect(sheet).toBeHidden();
    await expect(visibleCards(page)).toHaveCount(1);
    await expect(page.locator('#resultats-nombre')).toHaveText('1 séjour');
    expect(new URL(page.url()).searchParams.get('duree')).toBe('weekend');
  });

  test('le panneau monte du bas et tient dans 85 % de la hauteur', async ({ page }) => {
    await page.goto(LIST);
    await page.getByRole('button', { name: 'Filtrer' }).click();
    const box = await page.getByRole('dialog', { name: 'Filtrer les séjours' }).boundingBox();
    const viewport = page.viewportSize();
    expect(box && viewport).toBeTruthy();
    if (!box || !viewport) return;
    expect(box.height).toBeLessThanOrEqual(viewport.height * 0.85 + 1);
    if (viewport.width < 768)
      expect(Math.round(box.y + box.height)).toBeGreaterThanOrEqual(viewport.height - 1);
  });

  test('fermeture par le bouton et par Échap ; réinitialisation', async ({ page, isMobile }) => {
    await page.goto(LIST);
    await page.getByRole('button', { name: 'Filtrer' }).click();
    const sheet = page.getByRole('dialog', { name: 'Filtrer les séjours' });
    await sheet.getByRole('button', { name: 'Fermer les filtres' }).click();
    await expect(sheet).toBeHidden();
    if (!isMobile) {
      await page.getByRole('button', { name: 'Filtrer' }).click();
      await page.keyboard.press('Escape');
      await expect(sheet).toBeHidden();
    }
    await page.getByRole('button', { name: 'Filtrer' }).click();
    await sheet.getByRole('button', { name: 'Culture' }).click();
    await sheet.getByRole('button', { name: 'Réinitialiser' }).click();
    await expect(sheet.getByRole('button', { name: 'Voir 3 séjours' })).toBeVisible();
  });

  test('état vide avec contact WhatsApp', async ({ page }) => {
    await page.goto(`${LIST}?duree=weekend&budget=gt500k`);
    await expect(visibleCards(page)).toHaveCount(0);
    await expect(page.locator('#liste-vide')).toBeVisible();
    await expect(page.locator('#liste-vide').getByRole('link', { name: /WhatsApp/ })).toBeVisible();
    await expectNoAxeViolations(page, 'liste vide');
  });

  test('zoom à 200 % sans défilement horizontal', async ({ page }) => {
    await page.goto(LIST);
    await setTextZoom(page, 2);
    await expectNoHorizontalScroll(page);
  });
});
