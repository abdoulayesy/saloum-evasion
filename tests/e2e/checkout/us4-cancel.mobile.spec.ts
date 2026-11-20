import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { expectNoAxeViolations } from '../support/a11y';
import {
  addAccommodation,
  adminGet,
  adminPatch,
  bookableAccommodationPath,
  fillContact,
  payBookingInFull,
  payWithFake,
  useProjectNetwork,
} from '../support/checkout';
import { isoInDays, uniqueName } from '../support/request';

// T082 (US4, FR-026 à FR-030) : depuis la page de la réservation, montant remboursable du jour ;
// annulation à J-40 (100 %), J-20 (50 %), J-5 (0 %) selon les conditions de l'hébergement
// (100 % dès 30 jours, 50 % dès 14 jours) ; statuts `requested` → `approved` → `paid` visibles
// par le voyageur ; remboursement par la passerelle sur le moyen d'origine.

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const refundOf = async (request: APIRequestContext, reference: string): Promise<number> => {
  const bookings = await adminGet(
    request,
    `/api/bookings?where[reference][equals]=${reference}&depth=0`,
  );
  const booking = isRecord(bookings) && Array.isArray(bookings.docs) ? bookings.docs[0] : null;
  const bookingId = isRecord(booking) ? booking.id : null;
  const refunds = await adminGet(
    request,
    `/api/refunds?where[booking][equals]=${String(bookingId)}&depth=0`,
  );
  const refund = isRecord(refunds) && Array.isArray(refunds.docs) ? refunds.docs[0] : null;
  return isRecord(refund) && typeof refund.id === 'number' ? refund.id : 0;
};

const openCancelPage = async (page: Page) => {
  await page.getByRole('link', { name: 'Demander l’annulation' }).click();
  await expect(page).toHaveURL(/\/annulation$/, { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'Annuler ma réservation' })).toBeVisible();
};

test.describe('US4 — annuler et suivre son remboursement @checkout @us4', () => {
  test.beforeEach(async ({ page }, testInfo) => useProjectNetwork(page, testInfo.project.name));

  test('J-40 : 100 % remboursable, statuts demandé → validé → versé', async ({ page, request }) => {
    test.setTimeout(240_000);
    const reference = await payBookingInFull(page, request, {
      firstName: uniqueName('Fatou'),
      inDays: 40,
    });
    await expect(page.getByTestId('refundable-today')).toBeVisible();
    await openCancelPage(page);
    await expect(page.locator('[data-testid^="refund-"]').first()).toContainText('(100 %)');
    await expectNoAxeViolations(page, 'annulation');
    // Confirmation obligatoire.
    await page.getByRole('checkbox', { name: 'Je confirme ma demande d’annulation.' }).check();
    await page.getByRole('button', { name: 'Demander l’annulation' }).click();
    await expect(
      page.getByText('Votre demande d’annulation est enregistrée.', { exact: false }),
    ).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText('Annulation demandée')).toBeVisible();
    await expect(page.getByTestId('refund-status')).toContainText('Demandé');

    // L'équipe (finance) valide un remboursement manuel justifié, puis le marque versé.

    const refundId = await refundOf(request, reference);
    expect(refundId).toBeGreaterThan(0);
    expect(
      await adminPatch(request, `/api/refunds/${refundId}`, {
        status: 'approved',
        method: 'wave',
        methodJustification: 'Compte Wave indiqué par la voyageuse (test)',
      }),
    ).toBe(200);
    await page.reload();
    await expect(page.getByTestId('refund-status')).toContainText('Validé');
    expect(
      await adminPatch(request, `/api/refunds/${refundId}`, {
        status: 'paid',
        gatewayRefundReference: 'WAVE-TEST-1',
      }),
    ).toBe(200);
    await page.reload();
    await expect(page.getByTestId('refund-status')).toContainText('Versé');
    await expect(page.getByText('Annulée', { exact: true })).toBeVisible();
  });

  test('J-20 : 50 % remboursable, versé par la passerelle sur le moyen d’origine', async ({
    page,
    request,
  }) => {
    test.setTimeout(240_000);
    const reference = await payBookingInFull(page, request, {
      firstName: uniqueName('Moussa'),
      inDays: 20,
    });
    await openCancelPage(page);
    await expect(page.locator('[data-testid^="refund-"]').first()).toContainText('(50 %)');
    await page.getByRole('checkbox', { name: 'Je confirme ma demande d’annulation.' }).check();
    await page.getByRole('button', { name: 'Demander l’annulation' }).click();
    await expect(page.getByTestId('refund-status')).toContainText('Demandé', { timeout: 15_000 });

    const refundId = await refundOf(request, reference);
    // Moyen d'origine : la passerelle factice rembourse aussitôt → versé.
    expect(await adminPatch(request, `/api/refunds/${refundId}`, { status: 'approved' })).toBe(200);
    await page.reload();
    await expect(page.getByTestId('refund-status')).toContainText('Versé');
  });

  test('J-5 : rien de remboursable, montant affiché avant la confirmation', async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);
    await payBookingInFull(page, request, { firstName: uniqueName('Khady'), inDays: 5 });
    await expect(page.getByTestId('refundable-today')).toContainText(/\b0\sFCFA/);
    await openCancelPage(page);
    await expect(page.locator('[data-testid^="refund-"]').first()).toContainText('(0 %)');
    await expect(page.getByTestId('refund-total')).toContainText(/\b0\sFCFA/);
  });

  test('annulation partielle d’une ligne : la réservation reste active', async ({
    page,
    request,
  }) => {
    test.setTimeout(240_000);
    // Hébergement à J-40 et une expérience suggérée au panier.
    await page.goto(await bookableAccommodationPath(request));
    await addAccommodation(page, 40, 2);
    const suggestion = page.locator('#suggestions ~ div details').first();
    await suggestion.locator('summary').click();
    await suggestion.getByLabel(/^Date$/).fill(isoInDays(41));
    await suggestion.getByRole('button', { name: 'Ajouter au panier' }).click();
    await expect(page.locator('main li h2')).toHaveCount(2, { timeout: 30_000 });
    await page.goto('/fr/commande/coordonnees');
    await fillContact(page, { firstName: uniqueName('Aminata') });
    await page.getByRole('button', { name: 'Continuer : paiement' }).click();
    await expect(page).toHaveURL(/\/fr\/commande\/paiement$/, { timeout: 30_000 });
    await page.getByRole('radio', { name: 'Orange Money' }).check();
    await page.getByRole('checkbox', { name: /accepte les conditions d’annulation/ }).check();
    await page
      .getByRole('button', { name: /^Payer/ })
      .last()
      .click();
    await payWithFake(page, 'Réussir');
    await expect(page.getByText('Payée')).toBeVisible({ timeout: 30_000 });
    const reference = (await page.getByTestId('booking-reference').textContent())?.trim() ?? '';

    // Annulation de l'expérience seulement.
    await openCancelPage(page);
    const lines = page.locator('input[name="lineIds"]');
    await expect(lines).toHaveCount(2);
    await lines.first().uncheck();
    await page.getByRole('checkbox', { name: 'Je confirme ma demande d’annulation.' }).check();
    await page.getByRole('button', { name: 'Demander l’annulation' }).click();
    await expect(page.getByTestId('refund-status')).toContainText('Demandé', { timeout: 15_000 });

    const refundId = await refundOf(request, reference);
    expect(await adminPatch(request, `/api/refunds/${refundId}`, { status: 'approved' })).toBe(200);
    await page.reload();
    await expect(page.getByTestId('refund-status')).toContainText('Versé');
    await expect(page.getByText('Partiellement annulée')).toBeVisible();
  });
});
