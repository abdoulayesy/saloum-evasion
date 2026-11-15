import { expect, test } from '@playwright/test';
import { applyNetwork } from './support/network';
import {
  fillRequiredFields,
  findOutboxMessage,
  isoInDays,
  uniqueName,
  waitAntiBotDelay,
} from './support/request';

// T152 (SC-003) : en 3G à 360 px, de l'accueil à la demande envoyée en 120 s au plus ; la
// demande est enregistrée (référence) et l'e-mail part vers l'équipe. Dates et voyageurs de la
// recherche de l'accueil se retrouvent dans le formulaire.
test.describe('US1 — parcours complet jusqu’à la demande', () => {
  test('accueil → liste → fiche → demande envoyée en moins de 120 s', async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(browserName !== 'chromium' || !isMobile, 'Profil 3G : Chromium mobile');
    test.setTimeout(180_000);
    await applyNetwork(page, '3g');
    const started = Date.now();
    const firstName = uniqueName('Awa');
    const arrival = isoInDays(40);

    await page.goto('/fr');
    await page.locator('input[name="arrivee"]').fill(arrival);
    await page.locator('input[name="adultes"]').fill('3');
    await page.getByRole('button', { name: 'Voir les séjours' }).click();
    await expect(page).toHaveURL(/\/fr\/sejours\?.*arrivee=/);

    await page
      .getByRole('link', { name: /Week-end bolong à Ndangane/ })
      .first()
      .click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Week-end bolong à Ndangane');
    await page
      .locator('[data-sticky-action-bar]')
      .getByRole('link', { name: 'Demander ce séjour' })
      .click();

    await expect(page).toHaveURL(/\/fr\/demande\?/);
    await expect(page.getByRole('checkbox', { name: /Week-end bolong à Ndangane/ })).toBeChecked();
    await expect(page.getByLabel('Arrivée')).toHaveValue(arrival);
    await expect(page.getByLabel('Adultes')).toHaveValue('3');
    await fillRequiredFields(page, { firstName, arrival });
    await waitAntiBotDelay(page);
    await page.getByRole('button', { name: 'Envoyer ma demande' }).click();
    await expect(page.getByRole('heading', { name: 'Demande envoyée' })).toBeVisible();

    const elapsed = (Date.now() - started) / 1000;
    expect(elapsed, 'durée du parcours (s)').toBeLessThanOrEqual(120);
    const mail = await findOutboxMessage(firstName);
    expect(mail.text).toContain('3 adulte(s)');
  });
});
