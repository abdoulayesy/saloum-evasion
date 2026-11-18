import { expect, test } from '@playwright/test';
import { reachPaymentPage } from '../support/checkout';
import { uniqueName } from '../support/request';

// T039 (constitution V, FR-008, FR-014) : prix TTC en FCFA avec la mention « indicatif » de l'euro
// à chaque étape ; conditions d'annulation visibles avant le bouton « Payer », dont l'acceptation
// est obligatoire.

test.describe('confiance : prix et conditions avant paiement @cancellation-visible', () => {
  test('FCFA + euro indicatif à chaque étape, conditions acceptées avant de payer', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    await reachPaymentPage(page, request, { firstName: uniqueName('Confiance') });

    for (const path of ['/fr/panier', '/fr/commande/coordonnees', '/fr/commande/paiement']) {
      await page.goto(path);
      await expect(page.locator('main')).toContainText('FCFA');
      await expect(page.locator('main')).toContainText(/indicatif/);
    }

    // Conditions d'annulation au-dessus du bouton de paiement.
    const terms = page.getByRole('heading', { name: 'Conditions d’annulation' });
    const pay = page.getByRole('button', { name: /^Payer/ }).first();
    await expect(terms).toBeVisible();
    const termsBox = await terms.boundingBox();
    const payBox = await pay.boundingBox();
    expect((termsBox?.y ?? 0) < (payBox?.y ?? 0)).toBe(true);
    await expect(page.locator('#conditions-annulation ~ ul')).toContainText('remboursé');

    // Sans acceptation : refus serveur, aucune redirection vers la passerelle.
    await page.getByRole('radio', { name: 'Wave' }).check();
    await page.evaluate(() => {
      for (const input of document.querySelectorAll('input[name="acceptCancellation"]'))
        input.removeAttribute('required');
    });
    await pay.click();
    await expect(page).toHaveURL(/erreur=conditions/);
    await expect(page.locator('main').getByRole('alert')).toContainText('accepter les conditions');
  });
});
