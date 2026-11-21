import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from './support/a11y';
import { expectNoHorizontalScroll, expectTouchTargets } from './support/mobile';

// T108 : hub des expériences et page d'univers à 360 px.
test.describe('hub des expériences et univers', () => {
  test('hub : H1, trois univers, toutes les expériences', async ({ page }) => {
    await page.goto('/fr/experiences');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Activités et excursions dans le Sine-Saloum',
    );
    await expect(page.locator('#hub-univers + ul > li')).toHaveCount(3);
    // Présence des expériences du seed (un test de publication peut en ajouter temporairement).
    for (const title of [
      'Excursion en pirogue dans les bolongs',
      'Randonnée en quad dans le Sine-Saloum',
      'Balade à cheval à Palmarin',
      'Table du Saloum chez l’habitant',
    ]) {
      await expect(
        page.locator('#liste-experiences + ul').getByRole('link', { name: title }),
      ).toBeVisible();
    }
    await expectNoAxeViolations(page, 'hub des expériences');
    await expectTouchTargets(page);
    await expectNoHorizontalScroll(page);
  });

  test('univers : seulement ses expériences, lien depuis le hub', async ({ page }) => {
    await page.goto('/fr/experiences');
    await page.getByRole('link', { name: 'Terre & villages' }).click();
    await expect(page).toHaveURL(/\/fr\/experiences\/terre-et-villages$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Terre & villages');
    const list = page.locator('#liste-experiences + ul');
    await expect(list.getByRole('link', { name: 'Balade à cheval à Palmarin' })).toBeVisible();
    await expect(
      list.getByRole('link', { name: 'Excursion en pirogue dans les bolongs' }),
    ).toHaveCount(0);
    await expectNoAxeViolations(page, 'univers');
    await expectNoHorizontalScroll(page);
  });
});
