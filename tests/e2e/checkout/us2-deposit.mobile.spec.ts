import { expect, test, type APIRequestContext } from '@playwright/test';
import { expectNoAxeViolations } from '../support/a11y';
import {
  CRON_SECRET,
  fillContact,
  outboxContaining,
  payWithFake,
  reachPaymentPage,
  useProjectNetwork,
} from '../support/checkout';
import { isoInDays, uniqueName } from '../support/request';

// T066 (US2, FR-016, FR-017) : acompte proposé à J+45 et payé ; rappel du solde à J-21 avec un
// lien qui s'ouvre sans le cookie du panier ; dernier rappel à la date limite sans annulation ;
// solde payé depuis le lien, réservation payée et bon PDF mis à jour envoyé. Acompte absent à
// J+20 (raison affichée) et pour un séjour qui exige le paiement total.

const ARRIVAL_IN_DAYS = 45;

/** File de tâches exécutée à une date donnée (passerelle factice uniquement). */
const runJobsAt = async (request: APIRequestContext, daysFromNow: number) => {
  const response = await request.get(`/api/jobs/run?now=${isoInDays(daysFromNow)}T08:00:00Z`, {
    headers: { authorization: `Bearer ${CRON_SECRET}` },
  });
  expect(response.status()).toBe(200);
};

/**
 * Attend l'e-mail de la réservation dont l'objet commence par `subject`. La file et la date de
 * référence sont partagées entre les projets lancés en parallèle : un autre test peut déjà avoir
 * envoyé un rappel ultérieur pour cette réservation, d'où la sélection par objet.
 */
const waitForEmail = async (
  request: APIRequestContext,
  daysFromNow: number,
  reference: string,
  subject: string,
) => {
  const find = async () =>
    (await outboxContaining(reference)).find((message) =>
      String(message.content.subject ?? '').startsWith(subject),
    );
  await expect
    .poll(
      async () => {
        await runJobsAt(request, daysFromNow);
        return (await find()) !== undefined;
      },
      { timeout: 60_000, intervals: [1000, 2000, 3000] },
    )
    .toBe(true);
  return (await find())?.content ?? {};
};

const bookableStayPath = async (request: APIRequestContext) => {
  const response = await request.get(
    '/api/stays?where[bookable][equals]=true&locale=fr&depth=0&limit=1&sort=id',
  );
  const body: unknown = await response.json();
  const docs =
    typeof body === 'object' && body !== null && 'docs' in body && Array.isArray(body.docs)
      ? body.docs
      : [];
  const first: unknown = docs[0];
  const seo = typeof first === 'object' && first !== null && 'seo' in first ? first.seo : undefined;
  const slug =
    typeof seo === 'object' && seo !== null && 'slug' in seo && typeof seo.slug === 'string'
      ? seo.slug
      : null;
  if (!slug) throw new Error('Aucun séjour vendable : lancer `pnpm seed:checkout`.');
  return `/fr/sejours/${slug}`;
};

test.describe('US2 — acompte maintenant, solde plus tard @checkout @us2', () => {
  test.beforeEach(async ({ page }, testInfo) => useProjectNetwork(page, testInfo.project.name));

  test('acompte à J+45, rappels du solde, solde payé depuis le lien', async ({
    page,
    request,
    browser,
  }) => {
    test.setTimeout(240_000);
    const firstName = uniqueName('Fatou');
    await reachPaymentPage(page, request, { firstName, inDays: ARRIVAL_IN_DAYS });

    // Choix acompte / total : montant de l'acompte, solde et date limite affichés.
    await expect(
      page.getByText(/^Acompte de .+ maintenant, solde de .+ à régler avant le/),
    ).toBeVisible();
    await page.getByRole('radio', { name: 'Carte bancaire' }).check();
    await page.getByRole('checkbox', { name: /accepte les conditions d’annulation/ }).check();
    await page.getByRole('button', { name: /^Payer l’acompte de/ }).click();
    await payWithFake(page, 'Réussir');

    await expect(page).toHaveURL(/\/fr\/reservation\/se-[a-z2-9]{6}/, { timeout: 30_000 });
    const reference = (await page.getByTestId('booking-reference').textContent())?.trim() ?? '';
    expect(reference).toMatch(/^SE-[A-HJ-NP-Z2-9]{6}$/);
    await expect(page.getByText('Acompte payé')).toBeVisible();
    await expect(page.getByTestId('balance-due')).toContainText('à régler avant le');

    // J-21 (7 jours avant la date limite J-14) : lien de paiement du solde par e-mail.
    const reminder = await waitForEmail(
      request,
      ARRIVAL_IN_DAYS - 21,
      reference,
      `Solde de votre réservation ${reference}`,
    );
    expect(String(reminder.text)).toContain('Payer le solde');
    const link = /https?:\/\/[^\s]+\/solde\?k=[A-Za-z0-9_-]+/.exec(String(reminder.text))?.[0];
    expect(link).toBeDefined();
    expect((await outboxContaining(reference)).some((m) => m.file.startsWith('whatsapp-'))).toBe(
      true,
    );

    // Date limite passée sans paiement : dernier rappel au voyageur.
    const overdue = await waitForEmail(
      request,
      ARRIVAL_IN_DAYS - 14,
      reference,
      `Dernier rappel : solde de votre réservation ${reference}`,
    );
    expect(String(overdue.text)).toContain('Votre réservation est maintenue');

    // Le lien s'ouvre sur un autre appareil (sans cookie du panier). La page du solde ne
    // s'affiche que pour une réservation `deposit_paid` : aucune annulation automatique.
    const other = await browser.newContext({ viewport: { width: 360, height: 800 } });
    const phone = await other.newPage();
    const { pathname, search } = new URL(link ?? '');
    await phone.goto(`${pathname}${search}`);
    await expect(phone.getByRole('heading', { name: 'Payer le solde' })).toBeVisible();
    await expect(phone).toHaveTitle(/Payer le solde/);
    await expect(phone.getByTestId('balance-amount')).toContainText('FCFA');
    await expectNoAxeViolations(phone, 'paiement du solde');
    // Mêmes moyens, au même rang, aucun présélectionné.
    const methods = phone.getByRole('radio');
    await expect(methods).toHaveCount(3);
    for (const method of await methods.all()) await expect(method).not.toBeChecked();
    await phone.getByRole('radio', { name: 'Orange Money' }).check();
    await phone.getByRole('button', { name: /^Payer le solde de/ }).click();
    await payWithFake(phone, 'Réussir');

    await expect(phone).toHaveURL(/\/fr\/reservation\/se-[a-z2-9]{6}/, { timeout: 30_000 });
    await expect(phone.getByText('Payée')).toBeVisible();
    await expect(phone.getByTestId('balance-due')).toHaveCount(0);

    // Confirmation du solde avec le bon PDF mis à jour.
    const paid = await waitForEmail(request, 0, reference, `Solde reçu : réservation ${reference}`);
    expect(JSON.stringify(paid.attachments)).toContain(`${reference}.pdf`);
    await other.close();
  });

  test('arrivée à J+20 : paiement total seul, raison affichée', async ({ page, request }) => {
    test.setTimeout(120_000);
    await reachPaymentPage(page, request, { firstName: uniqueName('Moussa'), inDays: 20 });
    await expect(page.getByTestId('deposit-unavailable')).toHaveText(
      'Votre arrivée est trop proche pour un acompte : le paiement se fait en une fois.',
    );
    await expect(page.getByRole('button', { name: /acompte/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Payer .+ FCFA$/ })).toBeVisible();
  });

  test('séjour qui exige le paiement total : pas d’acompte, même loin', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    await page.goto(await bookableStayPath(request));
    const form = page.locator('#reserver');
    await form.getByLabel(/^Arrivée$/).fill(isoInDays(60));
    await form.getByRole('button', { name: 'Ajouter au panier' }).click();
    await expect(page).toHaveURL(/\/fr\/panier\?ajoute=/, { timeout: 30_000 });
    await page.goto('/fr/commande/coordonnees');
    await fillContact(page, { firstName: uniqueName('Khady') });
    await page.getByRole('button', { name: 'Continuer : paiement' }).click();
    await expect(page).toHaveURL(/\/fr\/commande\/paiement$/, { timeout: 30_000 });
    await expect(page.getByTestId('deposit-unavailable')).toHaveText(
      'Ce séjour se règle en une seule fois, sans acompte.',
    );
    await expect(page.getByRole('button', { name: /acompte/ })).toHaveCount(0);
  });
});
