import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations } from '../support/a11y';
import { linkInOutbox, outboxContaining, payBookingInFull, runJobs } from '../support/checkout';
import { uniqueName } from '../support/request';

// T083 (US4, FR-026 ; research R13) : « Retrouver ma réservation » répond la même chose que la
// paire référence + e-mail existe ou non ; le lien reçu ouvre la réservation ; 5 demandes par
// heure et par adresse IP ; jeton invalide ou référence inconnue → même page « lien invalide ».

const SENT = 'Si une réservation correspond, un lien vient d’être envoyé à cette adresse e-mail.';

/** Adresse IP propre au test (limitation par IP, projets lancés en parallèle). */
const uniqueIp = () =>
  `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;

const askForLink = async (page: Page, reference: string, email: string) => {
  await page.goto('/fr/reservation/retrouver');
  await page.getByLabel('Référence de réservation').fill(reference);
  await page.getByLabel('E-mail').fill(email);
  await page.getByRole('button', { name: 'Recevoir mon lien' }).click();
};

test.describe('US4 — retrouver sa réservation sans compte @checkout @us4', () => {
  test('même réponse que la réservation existe ou non ; lien reçu valide', async ({
    page,
    request,
    browser,
  }) => {
    test.setTimeout(180_000);
    const firstName = uniqueName('Retrouve');
    const email = `${firstName.toLowerCase()}@example.sn`;
    const reference = await payBookingInFull(page, request, { firstName, inDays: 30 });

    const other = await browser.newContext({
      viewport: { width: 360, height: 800 },
      extraHTTPHeaders: { 'x-forwarded-for': uniqueIp() },
    });
    const phone = await other.newPage();
    await phone.goto('/fr/reservation/retrouver');
    await expectNoAxeViolations(phone, 'retrouver ma réservation');

    // Paire inconnue : même réponse, aucun envoi.
    const stranger = `${uniqueName('Inconnu').toLowerCase()}@example.sn`;
    await askForLink(phone, reference, stranger);
    await expect(phone.getByRole('status')).toHaveText(SENT, { timeout: 15_000 });
    await askForLink(phone, 'SE-ZZZZZZ', email);
    await expect(phone.getByRole('status')).toHaveText(SENT, { timeout: 15_000 });

    // Bonne paire (référence en minuscules acceptée) : lien envoyé par e-mail.
    await askForLink(phone, reference.toLowerCase(), email.toUpperCase());
    await expect(phone.getByRole('status')).toHaveText(SENT, { timeout: 15_000 });
    await expect
      .poll(
        async () => {
          await runJobs(request);
          return (await outboxContaining(`Votre lien de réservation — ${reference}`)).length;
        },
        { timeout: 60_000, intervals: [1000, 2000, 3000] },
      )
      .toBeGreaterThanOrEqual(1);
    expect(await outboxContaining(stranger)).toHaveLength(0);
    const link = await linkInOutbox(
      `Votre lien de réservation — ${reference}`,
      /https?:\/\/\S+\/fr\/reservation\/se-[a-z2-9]{6}\?k=\S+/,
    );
    const url = new URL(link ?? 'http://localhost/');
    await phone.goto(`${url.pathname}${url.search}`);
    await expect(phone.getByTestId('booking-reference')).toHaveText(reference);
    await other.close();
  });

  test('5 demandes par heure et par adresse IP', async ({ browser }) => {
    test.setTimeout(120_000);
    const context = await browser.newContext({
      extraHTTPHeaders: { 'x-forwarded-for': uniqueIp() },
    });
    const page = await context.newPage();
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      await askForLink(page, 'SE-ZZZZZZ', 'personne@example.sn');
      await expect(page.getByRole('status')).toHaveText(SENT, { timeout: 15_000 });
    }
    await askForLink(page, 'SE-ZZZZZZ', 'personne@example.sn');
    await expect(page.locator('main').getByRole('alert')).toHaveText(
      'Trop de demandes depuis cette connexion. Réessayez dans une heure.',
      { timeout: 15_000 },
    );
    await context.close();
  });

  test('jeton invalide ou référence inconnue : même page, aucune information', async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);
    const reference = await payBookingInFull(page, request, {
      firstName: uniqueName('Jeton'),
      inDays: 30,
    });
    const visitor = await page.context().browser()?.newContext();
    const fresh = await visitor?.newPage();
    if (!fresh) throw new Error('Contexte de navigation indisponible');
    await fresh.goto(`/fr/reservation/${reference.toLowerCase()}?k=jeton-invalide`);
    const invalid = await fresh.getByRole('heading', { level: 1 }).textContent();
    await fresh.goto('/fr/reservation/se-zzzzzz?k=jeton-invalide');
    expect(await fresh.getByRole('heading', { level: 1 }).textContent()).toBe(invalid);
    expect(invalid).toBe('Ce lien n’est plus valide.');
    await expect(fresh.getByText(reference)).toHaveCount(0);
    await visitor?.close();
  });
});
