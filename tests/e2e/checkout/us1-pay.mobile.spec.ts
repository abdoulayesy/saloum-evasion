import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from '../support/a11y';
import {
  addAccommodation,
  bookableAccommodationPath,
  fillContact,
  outboxContaining,
  payWithFake,
  runJobs,
  useProjectNetwork,
} from '../support/checkout';
import { isoInDays, uniqueName } from '../support/request';

// T037 (US1, SC-001, SC-002) : depuis une fiche hébergement, panier hébergement + expérience +
// transfert aller-retour, coordonnées, paiement Wave / Orange Money / carte avec la passerelle
// factice, confirmation, e-mail avec bon PDF et WhatsApp ; moins de 3 minutes, sans compte, axe à
// chaque étape. Projet android-360-3g (360 px, 3G simulée) grâce à l'étiquette @checkout.

test.describe('US1 — composer et payer son séjour @checkout @us1', () => {
  test.describe.configure({ mode: 'serial' });
  test.beforeEach(async ({ page }, testInfo) => useProjectNetwork(page, testInfo.project.name));

  for (const method of ['Wave', 'Orange Money', 'Carte bancaire'] as const) {
    test(`parcours complet payé par ${method} en moins de 3 minutes`, async ({ page, request }) => {
      test.setTimeout(240_000);
      const started = Date.now();
      const firstName = uniqueName('Awa');

      await page.goto(await bookableAccommodationPath(request));
      await expectNoAxeViolations(page, 'fiche hébergement vendable');
      await addAccommodation(page, 45, 2);

      // Panier : expérience suggérée et transfert aller-retour.
      await expect(page.getByText('C’est ajouté à votre panier.')).toBeVisible();
      // Métadonnées diffusées en flux (Next 15) : attendre le titre avant axe.
      await expect(page).toHaveTitle(/Votre panier/);
      await expectNoAxeViolations(page, 'panier');
      const suggestion = page.locator('#suggestions ~ div details').first();
      await suggestion.locator('summary').click();
      await suggestion.getByLabel(/^Date$/).fill(isoInDays(46));
      await suggestion.getByRole('button', { name: 'Ajouter au panier' }).click();
      await expect(page).toHaveURL(/ajoute=/);
      const transfer = page.locator('details', { hasText: 'Transfert depuis' });
      await transfer.locator('summary').click();
      await transfer.getByLabel('Heure de prise en charge (aller)').fill('10:30');
      await transfer.getByLabel('Heure de prise en charge (retour)').fill('15:00');
      await transfer.getByRole('button', { name: 'Ajouter au panier' }).click();
      await expect(page.locator('main li h2')).toHaveCount(4);

      // Coordonnées.
      await page.getByRole('link', { name: 'Continuer : mes coordonnées' }).click();
      await expect(page).toHaveURL(/\/fr\/commande\/coordonnees$/);
      await expect(page).toHaveTitle(/Coordonnées/);
      await expectNoAxeViolations(page, 'coordonnées');
      await fillContact(page, { firstName });
      await page.getByRole('button', { name: 'Continuer : paiement' }).click();

      // Paiement : conditions visibles, moyen choisi, acompte possible (arrivée à 45 jours).
      await expect(page).toHaveURL(/\/fr\/commande\/paiement$/, { timeout: 30_000 });
      await expect(page.getByRole('heading', { name: 'Conditions d’annulation' })).toBeVisible();
      await expect(page).toHaveTitle(/Paiement/);
      await expectNoAxeViolations(page, 'paiement');
      await page.getByRole('radio', { name: method }).check();
      await page.getByRole('checkbox', { name: /accepte les conditions d’annulation/ }).check();
      await page.getByRole('button', { name: /^Payer le total de/ }).click();

      await payWithFake(page, 'Réussir');
      await expect(page).toHaveURL(/\/fr\/reservation\/se-[a-z2-9]{6}/, { timeout: 30_000 });
      const reference = (await page.getByTestId('booking-reference').textContent())?.trim() ?? '';
      expect(reference).toMatch(/^SE-[A-HJ-NP-Z2-9]{6}$/);
      await expect(page.getByText('Payée')).toBeVisible();
      await expect(page).toHaveTitle(/Votre réservation/);
      await expectNoAxeViolations(page, 'confirmation');
      expect(Date.now() - started).toBeLessThan(180_000);

      // Notifications : e-mail avec le bon PDF et message WhatsApp (journalisé).
      // La file est partagée avec les tests parallèles : on la relance à chaque essai.
      await expect
        .poll(
          async () => {
            await runJobs(request);
            return (await outboxContaining(reference)).length;
          },
          { timeout: 60_000, intervals: [1000, 2000, 3000] },
        )
        .toBeGreaterThanOrEqual(2);
      const messages = await outboxContaining(reference);
      const email = messages.find(
        (message) =>
          message.content.subject !== undefined &&
          message.content.to !== undefined &&
          String(message.content.to).includes(firstName.toLowerCase()),
      );
      expect(JSON.stringify(email?.content.attachments)).toContain(`${reference}.pdf`);
      expect(messages.some((message) => message.file.startsWith('whatsapp-'))).toBe(true);

      // Bon PDF accessible depuis la page.
      const voucher = await page.request.get(`/api/bookings/${reference.toLowerCase()}/voucher`);
      expect(voucher.headers()['content-type']).toBe('application/pdf');
    });
  }
});
