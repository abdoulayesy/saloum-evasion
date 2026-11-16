import { expect, test } from '@playwright/test';

// T153 (US2) : arrivée directe sur une fiche expérience → ajout à la demande (on reste sur la
// fiche, annonce polie, compteur dans l'en-tête) → l'expérience figure dans le formulaire.
const EXPERIENCE = '/fr/experiences/mangrove-et-iles/excursion-pirogue-bolongs';

test.describe('US2 — ajouter une expérience à sa demande', () => {
  test('ajout depuis la fiche, compteur, puis formulaire pré-rempli', async ({ page }) => {
    await page.goto(EXPERIENCE);
    const bar = page.locator('[data-sticky-action-bar]');
    await bar.getByRole('link', { name: 'Ajouter à ma demande' }).click();
    await expect(page).toHaveURL(new RegExp(`${EXPERIENCE}$`));
    await expect(
      page.getByRole('status').filter({ hasText: 'est ajouté à votre demande' }),
    ).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Ma demande : 1 élément' })).toBeVisible();

    await bar.getByRole('link', { name: 'Voir ma demande' }).click();
    await expect(page).toHaveURL(/\/fr\/demande/);
    await expect(
      page.getByRole('checkbox', { name: /Excursion en pirogue dans les bolongs/ }),
    ).toBeChecked();
  });

  test('sans stockage local, le lien transporte l’expérience dans l’URL', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get: () => {
          throw new Error('stockage bloqué');
        },
      });
    });
    await page.goto(EXPERIENCE);
    // L'ajout ne peut pas être mémorisé : « Voir ma demande » garde l'élément dans l'URL.
    await page
      .locator('[data-sticky-action-bar]')
      .getByRole('link', { name: 'Ajouter à ma demande' })
      .click();
    await page.goto('/fr/demande?experience=excursion-pirogue-bolongs');
    await expect(
      page.getByRole('checkbox', { name: /Excursion en pirogue dans les bolongs/ }),
    ).toBeChecked();
  });
});
