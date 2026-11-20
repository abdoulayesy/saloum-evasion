import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { expectNoAxeViolations } from '../support/a11y';
import {
  addAccommodation,
  bookableAccommodationPath,
  fillContact,
  linkInOutbox,
  outboxContaining,
  payWithFake,
  runJobs,
  runJobsAt,
  useProjectNetwork,
} from '../support/checkout';
import { isoInDays, uniqueName } from '../support/request';

// T074 (US3, FR-031) : abandon après les coordonnées (relances acceptées) → relance à 1 h,
// journalisée, par e-mail et WhatsApp → désinscription en un geste (plus aucune relance) → le
// lien de reprise restaure le panier sur un autre appareil, à l'étape paiement → paiement.
// Projet desktop : un prix change entre l'abandon et la reprise → changement signalé au panier,
// total recalculé, paiement au nouveau prix.

const HOUR_MS = 60 * 60 * 1000;
const inHours = (hours: number) => new Date(Date.now() + hours * HOUR_MS);
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@saloum-evasion.test';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'demo-admin-password';
const RESUME_LINK = /https?:\/\/\S+\/panier\/reprendre\?t=\S+/;
const UNSUBSCRIBE_LINK = /https?:\/\/\S+\/panier\/desinscription\?t=\S+/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Montants formatés : espaces insécables remplacées pour comparer deux libellés. */
const normalize = (value: string): string => value.replace(/[  ]/g, ' ').trim();

const pathOf = (link: string | null): string => {
  const url = new URL(link ?? 'http://localhost/');
  return `${url.pathname}${url.search}`;
};

/** Coordonnées avec consentement aux relances, puis étape paiement. */
const leaveAtPayment = async (page: Page, firstName: string) => {
  await page.goto('/fr/commande/coordonnees');
  await fillContact(page, { firstName });
  await page.getByRole('checkbox', { name: /Me relancer si je ne termine pas/ }).check();
  await page.getByRole('button', { name: 'Continuer : paiement' }).click();
  await expect(page).toHaveURL(/\/fr\/commande\/paiement$/, { timeout: 30_000 });
};

const reminderEmails = async (email: string) =>
  (await outboxContaining(email)).filter(
    (message) => message.content.subject === 'Votre séjour vous attend',
  );

/** Relance à 1 h (la file et la date de référence sont partagées entre projets). */
const waitForReminder = async (request: APIRequestContext, email: string) => {
  await expect
    .poll(
      async () => {
        await runJobsAt(request, inHours(2));
        return (await reminderEmails(email)).length;
      },
      { timeout: 60_000, intervals: [1000, 2000, 3000] },
    )
    .toBeGreaterThanOrEqual(1);
};

/** Nombre de relances reçues une fois la file vidée (deux passages sans changement). */
const settledReminderCount = async (request: APIRequestContext, email: string) => {
  let previous = -1;
  let current = (await reminderEmails(email)).length;
  while (current !== previous) {
    previous = current;
    await runJobs(request);
    current = (await reminderEmails(email)).length;
  }
  return current;
};

const payOnResumedCart = async (page: Page) => {
  await page.getByRole('radio', { name: 'Wave' }).check();
  await page.getByRole('checkbox', { name: /accepte les conditions d’annulation/ }).check();
  await page
    .getByRole('button', { name: /^Payer/ })
    .last()
    .click();
  await payWithFake(page, 'Réussir');
  await expect(page).toHaveURL(/\/fr\/reservation\/se-[a-z2-9]{6}/, { timeout: 30_000 });
  await expect(page.getByText('Payée')).toBeVisible();
};

test.describe('US3 — relance après abandon et reprise du paiement @checkout @us3', () => {
  test.beforeEach(async ({ page }, testInfo) => useProjectNetwork(page, testInfo.project.name));

  test('relance à 1 h, désinscription en un geste, reprise sur un autre appareil', async ({
    page,
    request,
    browser,
  }) => {
    test.setTimeout(240_000);
    const firstName = uniqueName('Ibrahima');
    const email = `${firstName.toLowerCase()}@example.sn`;
    await page.goto(await bookableAccommodationPath(request));
    await addAccommodation(page, 20, 2);
    await leaveAtPayment(page, firstName);

    await waitForReminder(request, email);
    const resume = await linkInOutbox(email, RESUME_LINK);
    const unsubscribe = await linkInOutbox(email, UNSUBSCRIBE_LINK);
    expect(resume).not.toBeNull();
    expect(unsubscribe).not.toBeNull();
    // Même relance par WhatsApp (lien propre au canal, même panier).
    const cartId = /reprendre\?t=resume\.(\d+)\./.exec(resume ?? '')?.[1] ?? '';
    const whatsapp = (await outboxContaining(`resume.${cartId}.`)).filter((message) =>
      message.file.startsWith('whatsapp-'),
    );
    expect(whatsapp.length).toBeGreaterThanOrEqual(1);

    // Désinscription en un geste : plus aucune relance ensuite.
    const other = await browser.newContext({ viewport: { width: 360, height: 800 } });
    const phone = await other.newPage();
    await phone.goto(pathOf(unsubscribe));
    await expect(phone.getByRole('heading', { name: 'Rappels de paiement' })).toBeVisible();
    await expectNoAxeViolations(phone, 'désinscription');
    await phone.getByRole('button', { name: 'Ne plus recevoir de rappels' }).click();
    await expect(phone.getByRole('status')).toHaveText(
      'C’est noté : vous ne recevrez plus de rappels pour ce panier.',
    );
    // Une relance déjà inscrite par un autre projet (date de référence partagée) peut encore
    // être dans la file : on la vide avant de compter.
    const before = await settledReminderCount(request, email);
    for (let pass = 0; pass < 3; pass += 1) await runJobsAt(request, inHours(25));
    expect(await settledReminderCount(request, email)).toBe(before);

    // Reprise sur l'autre appareil : panier restauré, directement à l'étape paiement.
    await phone.goto(pathOf(resume));
    await expect(phone).toHaveURL(/\/fr\/commande\/paiement$/, { timeout: 30_000 });
    await payOnResumedCart(phone);
    await other.close();
  });

  test('prix changé entre l’abandon et la reprise : signalé, total recalculé', async ({
    page,
    request,
    browser,
  }, testInfo) => {
    // Modifie une offre partagée : un seul projet, pour ne pas gêner les autres tests.
    test.skip(testInfo.project.name !== 'desktop', 'Projet desktop seulement');
    test.setTimeout(240_000);
    const login = await request.post('/api/users/login', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    const loginBody: unknown = await login.json();
    const token = isRecord(loginBody) && typeof loginBody.token === 'string' ? loginBody.token : '';
    expect(token).not.toBe('');
    const auth = { authorization: `JWT ${token}` };

    const found: unknown = await (
      await request.get('/api/stays?where[bookable][equals]=true&locale=fr&depth=0&limit=1', {
        headers: auth,
      })
    ).json();
    const stay = isRecord(found) && Array.isArray(found.docs) ? found.docs[0] : null;
    const pricing = isRecord(stay) && isRecord(stay.pricing) ? stay.pricing : null;
    const seo = isRecord(stay) && isRecord(stay.seo) ? stay.seo : null;
    const low = typeof pricing?.lowSeasonPerPerson === 'number' ? pricing.lowSeasonPerPerson : 0;
    const high = typeof pricing?.highSeasonPerPerson === 'number' ? pricing.highSeasonPerPerson : 0;
    const id = isRecord(stay) ? stay.id : null;
    expect(low).toBeGreaterThan(0);

    const firstName = uniqueName('Awa');
    const email = `${firstName.toLowerCase()}@example.sn`;
    await page.goto(`/fr/sejours/${String(seo?.slug ?? '')}`);
    const form = page.locator('#reserver');
    await form.getByLabel(/^Arrivée$/).fill(isoInDays(60));
    await form.getByRole('button', { name: 'Ajouter au panier' }).click();
    await expect(page).toHaveURL(/\/fr\/panier\?ajoute=/, { timeout: 30_000 });
    await leaveAtPayment(page, firstName);

    const setPrices = (lowSeason: number, highSeason: number) =>
      request.patch(`/api/stays/${String(id)}?locale=fr`, {
        headers: auth,
        data: { pricing: { lowSeasonPerPerson: lowSeason, highSeasonPerPerson: highSeason } },
      });
    try {
      expect((await setPrices(low + 5_000, high + 5_000)).status()).toBe(200);
      await waitForReminder(request, email);
      const resume = await linkInOutbox(email, RESUME_LINK);

      const other = await browser.newContext({ viewport: { width: 360, height: 800 } });
      const phone = await other.newPage();
      await phone.goto(pathOf(resume));
      await expect(phone).toHaveURL(/\/fr\/panier\?reprise=changements$/, { timeout: 30_000 });
      await expect(phone.getByText(/Un prix ou une disponibilité a changé/)).toBeVisible();
      await expect(phone.getByText(/Le prix a changé depuis l’ajout/)).toBeVisible();
      const total = (await phone.getByTestId('cart-total').textContent()) ?? '';

      // Coordonnées reprises, réservation refigée au nouveau prix.
      await phone.getByRole('link', { name: 'Continuer : mes coordonnées' }).click();
      await fillContact(phone, { firstName });
      await phone.getByRole('button', { name: 'Continuer : paiement' }).click();
      await expect(phone).toHaveURL(/\/fr\/commande\/paiement$/, { timeout: 30_000 });
      const payLabel =
        (await phone
          .getByRole('button', { name: /^Payer/ })
          .last()
          .textContent()) ?? '';
      expect(normalize(payLabel)).toContain(normalize(total));
      await payOnResumedCart(phone);
      await other.close();
    } finally {
      await setPrices(low, high);
    }
  });
});
