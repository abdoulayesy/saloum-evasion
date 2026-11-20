import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations } from '../support/a11y';
import { payWithFake, reachPaymentPage, useProjectNetwork } from '../support/checkout';
import { uniqueName } from '../support/request';

// T073 (US3, FR-019, FR-021) : chaque cause d'échec est expliquée en langage simple, le panier
// reste intact, « Réessayer » et « Changer de moyen » ramènent au paiement en un geste ; une
// seconde tentative pendant un paiement en attente est refusée (renvoi vers son statut).

const CAUSES = [
  { button: 'Solde insuffisant', message: 'Le solde de votre compte est insuffisant.' },
  { button: 'Refuser', message: 'Le paiement a été refusé.' },
  { button: 'Délai dépassé', message: 'Le délai de paiement est dépassé.' },
  { button: 'Erreur technique', message: 'Un problème technique a empêché le paiement.' },
  { button: 'Annuler', message: 'Vous avez annulé le paiement : rien n’a été débité.' },
] as const;

const pay = async (page: Page, method: 'Wave' | 'Orange Money' | 'Carte bancaire') => {
  await page.getByRole('radio', { name: method }).check();
  await page.getByRole('checkbox', { name: /accepte les conditions d’annulation/ }).check();
  await page
    .getByRole('button', { name: /^Payer/ })
    .last()
    .click();
};

test.describe('US3 — échec de paiement expliqué, réessai en un geste @checkout @us3', () => {
  test.beforeEach(async ({ page }, testInfo) => useProjectNetwork(page, testInfo.project.name));

  test('chaque cause expliquée, panier intact, réessai puis autre moyen', async ({
    page,
    request,
  }) => {
    test.setTimeout(300_000);
    await reachPaymentPage(page, request, { firstName: uniqueName('Ibrahima'), inDays: 20 });

    for (const [index, cause] of CAUSES.entries()) {
      await pay(page, 'Orange Money');
      await payWithFake(page, cause.button);
      await expect(page).toHaveURL(/\/fr\/commande\/statut\?p=/);
      await expect(page.locator('main').getByRole('alert')).toContainText(cause.message, {
        timeout: 20_000,
      });
      if (index === 0) {
        await expect(page).toHaveTitle(/Paiement|Confirmation/);
        await expectNoAxeViolations(page, 'échec de paiement');
      }
      // Alternance des deux actions, chacune en un geste.
      const action = index % 2 === 0 ? 'Réessayer' : 'Changer de moyen de paiement';
      await page.getByRole('link', { name: action }).click();
      // WebKit sous charge (projets en parallèle) : navigation parfois plus lente que 5 s.
      await expect(page).toHaveURL(/\/fr\/commande\/paiement$/, { timeout: 15_000 });
    }

    // Panier intact après cinq échecs.
    await page.goto('/fr/panier');
    await expect(page.locator('main li h2')).toHaveCount(1);
    await page.goto('/fr/commande/paiement');

    // Autre moyen : réussite.
    await pay(page, 'Wave');
    await payWithFake(page, 'Réussir');
    await expect(page).toHaveURL(/\/fr\/reservation\/se-[a-z2-9]{6}/, { timeout: 30_000 });
    await expect(page.getByText('Payée')).toBeVisible();
  });

  test('seconde tentative pendant un paiement en attente : refusée, statut affiché', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    await reachPaymentPage(page, request, { firstName: uniqueName('Double'), inDays: 20 });
    await page.getByRole('radio', { name: 'Wave' }).check();
    await page.getByRole('checkbox', { name: /accepte les conditions d’annulation/ }).check();
    // Double appui : le bouton est désactivé dès le premier envoi.
    await page.getByRole('button', { name: /^Payer/ }).dblclick();
    await expect(page).toHaveURL(/\/dev\/fake-gateway\?ref=/, { timeout: 30_000 });

    // Retour sur le site sans finir : le paiement en cours est signalé…
    await page.goto('/fr/commande/paiement');
    await expect(
      page.getByText('Un paiement est déjà en cours pour cette réservation.'),
    ).toBeVisible();
    // … et une nouvelle tentative renvoie vers son statut, sans nouvelle page de paiement.
    await page.getByRole('radio', { name: 'Carte bancaire' }).check();
    await page.getByRole('checkbox', { name: /accepte les conditions d’annulation/ }).check();
    await page.getByRole('button', { name: /^Payer/ }).click();
    await expect(page).toHaveURL(/\/fr\/commande\/statut\?p=/, { timeout: 30_000 });
    await expect(page.locator('main').getByRole('status').first()).toContainText(
      'Paiement en cours de confirmation',
    );
  });
});
