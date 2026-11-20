import { expect, test } from '@playwright/test';
import {
  addAccommodation,
  bookableAccommodationPath,
  fillContact,
  payWithFake,
} from '../support/checkout';
import { uniqueName } from '../support/request';

// T041 (constitution I et III) : tunnel complet sans JavaScript (projet nojs) — ajout depuis la
// fiche, panier, coordonnées, paiement factice, statut actualisé à la main, confirmation.

test.describe('tunnel sans JavaScript @checkout @us1', () => {
  test('ajout, panier, coordonnées, paiement, confirmation', async ({
    page,
    request,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'nojs', 'Parcours propre au projet sans JavaScript.');
    test.setTimeout(120_000);
    await page.goto(await bookableAccommodationPath(request));
    await addAccommodation(page, 45, 2);
    await page.getByRole('link', { name: 'Continuer : mes coordonnées' }).click();
    await fillContact(page, { firstName: uniqueName('SansJs') });
    await page.getByRole('button', { name: 'Continuer : paiement' }).click();
    await expect(page).toHaveURL(/\/fr\/commande\/paiement$/);
    await page.getByRole('radio', { name: 'Orange Money' }).check();
    await page.getByRole('checkbox', { name: /accepte les conditions d’annulation/ }).check();
    await page.getByRole('button', { name: /^Payer le total de/ }).click();
    await payWithFake(page, 'Réussir');
    // Sans îlot d'interrogation : la page de statut ou la confirmation, selon l'arrivée de la notification.
    if (/\/commande\/statut/.test(page.url())) {
      await page.getByRole('link', { name: 'Actualiser' }).click();
    }
    await expect(page).toHaveURL(/\/fr\/reservation\/se-/);
    await expect(page.getByText('Payée')).toBeVisible();
  });
});
