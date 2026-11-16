import { expect, test } from '@playwright/test';

// T167 (mobile CHK040) : sur écran tactile, sans survol possible, le menu, les cartes, la
// galerie et les filtres s'utilisent au doigt (aucune fonction cachée derrière :hover).
test.describe('utilisable sans survol (tactile)', () => {
  test.beforeEach(({ hasTouch }) => {
    test.skip(!hasTouch, 'Profils tactiles');
  });

  test('menu au doigt', async ({ page }) => {
    await page.goto('/fr');
    await page.getByRole('link', { name: 'Menu' }).tap();
    const dialog = page.getByRole('dialog', { name: 'Menu' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('link', { name: 'Séjours' }).tap();
    await expect(page).toHaveURL(/\/fr\/sejours$/);
  });

  test('cartes : titre et prix visibles sans survol, ouverture au doigt', async ({ page }) => {
    await page.goto('/fr/sejours');
    const card = page.getByRole('link', { name: /Week-end bolong à Ndangane/ }).first();
    await expect(card).toBeVisible();
    await card.tap();
    await expect(page).toHaveURL(/\/fr\/sejours\/week-end-bolong-ndangane$/);
  });

  test('galerie au doigt', async ({ page }) => {
    await page.goto('/fr/sejours/week-end-bolong-ndangane');
    await page.getByRole('region', { name: 'Galerie de photos' }).scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Photo suivante' }).tap();
    await expect(page.getByText('Photo 2 sur 4')).toBeVisible();
  });

  test('filtres au doigt', async ({ page }) => {
    await page.goto('/fr/sejours');
    await page.getByRole('button', { name: 'Filtrer' }).tap();
    const sheet = page.getByRole('dialog', { name: 'Filtrer les séjours' });
    await sheet.getByRole('button', { name: 'Week-end (1 à 2 nuits)' }).tap();
    await sheet.getByRole('button', { name: 'Voir 1 séjour' }).tap();
    await expect(sheet).toBeHidden();
  });

  test('aucune règle CSS ne réserve une fonction au survol', async ({ page }) => {
    await page.goto('/fr/sejours');
    const hoverOnly = await page.evaluate(() => {
      const offenders: string[] = [];
      for (const sheet of [...document.styleSheets]) {
        let rules: CSSRuleList;
        try {
          rules = sheet.cssRules;
        } catch {
          continue;
        }
        for (const rule of [...rules]) {
          if (!(rule instanceof CSSStyleRule) || !rule.selectorText.includes(':hover')) continue;
          const style = rule.style;
          // Révéler un élément au seul survol : display, visibility ou opacity modifiés.
          if (style.display || style.visibility || style.opacity) offenders.push(rule.selectorText);
        }
      }
      return offenders;
    });
    expect(hoverOnly).toEqual([]);
  });
});
