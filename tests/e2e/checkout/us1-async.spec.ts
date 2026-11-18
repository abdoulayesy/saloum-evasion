import { expect, test } from '@playwright/test';
import { reachPaymentPage } from '../support/checkout';
import { uniqueName } from '../support/request';

// T040 (FR-020) : le statut repose sur la notification serveur, jamais sur le retour du
// navigateur. « Ne revient pas sur le site » : la réservation est payée quand même ; « retour avant
// confirmation » : écran d'attente puis confirmation automatique.

const startPayment = async (page: import('@playwright/test').Page) => {
  await page.getByRole('radio', { name: 'Wave' }).check();
  await page.getByRole('checkbox', { name: /accepte les conditions d’annulation/ }).check();
  await page.getByRole('button', { name: /^Payer le total de/ }).click();
  await expect(page).toHaveURL(/\/dev\/fake-gateway\?ref=/);
};

test.describe('notifications asynchrones de paiement @checkout', () => {
  test('ne revient pas sur le site : réservation payée par la seule notification', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    await reachPaymentPage(page, request, { firstName: uniqueName('Absent') });
    await startPayment(page);
    const reference = (await page.locator('dd').first().textContent())?.trim() ?? '';
    await page.getByRole('button', { name: /Ne pas revenir/ }).click();
    await expect(page.getByRole('status')).toContainText('Notification envoyée', {
      timeout: 30_000,
    });
    await page.goto(`/fr/reservation/${reference.toLowerCase()}`);
    await expect(page.getByText('Payée')).toBeVisible();
  });

  test('retour avant confirmation : attente puis confirmation', async ({ page, request }) => {
    test.setTimeout(120_000);
    await reachPaymentPage(page, request, { firstName: uniqueName('Pressee') });
    await startPayment(page);
    await page.goto(`${page.url()}&delayMs=5000`);
    await page.getByRole('button', { name: 'Réussir', exact: true }).click();
    await expect(page).toHaveURL(/\/fr\/commande\/statut\?p=/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Confirmation du paiement');
    await expect(page).toHaveURL(/\/fr\/reservation\/se-/, { timeout: 30_000 });
    await expect(page.getByText('Payée')).toBeVisible();
  });

  test('paiement refusé : cause affichée et réessai possible', async ({ page, request }) => {
    test.setTimeout(120_000);
    await reachPaymentPage(page, request, { firstName: uniqueName('Refus') });
    await startPayment(page);
    await page.getByRole('button', { name: 'Solde insuffisant', exact: true }).click();
    await expect(page).toHaveURL(/\/fr\/commande\/statut\?p=/);
    await expect(page.locator('main').getByRole('alert')).toContainText(/solde/i, {
      timeout: 20_000,
    });
    await page.getByRole('link', { name: 'Réessayer' }).click();
    await expect(page).toHaveURL(/\/fr\/commande\/paiement$/);
  });
});
