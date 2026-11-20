import { expect, test, type APIRequestContext, type Browser, type Page } from '@playwright/test';
import { expectNoAxeViolations } from '../support/a11y';
import { adminAuth, adminGet, payBookingInFull } from '../support/checkout';
import { uniqueName } from '../support/request';

// T092 (US5, FR-033 à FR-036) : un compte `finance` voit, par ligne d'une réservation, le
// prestataire, le taux et la commission ; affiche le relevé d'un prestataire (totaux égaux au
// calcul sur les écritures), enregistre un reversement et exporte le tableur. Un compte
// `operations` n'a accès ni aux montants à reverser, ni au relevé, ni à l'export.
// Admin sur ordinateur (dérogation D-T6b) : projet `desktop-admin`.

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const docsOf = (body: unknown): unknown[] =>
  isRecord(body) && Array.isArray(body.docs) ? body.docs : [];

const today = () => new Date().toISOString().slice(0, 10);

const PASSWORD = 'mot-de-passe-de-test-us5';

/** Compte de l'admin créé pour le test, avec le rôle demandé. */
const createUser = async (request: APIRequestContext, role: 'finance' | 'operations') => {
  const email = `${role}-${uniqueName('u').toLowerCase()}@saloum-evasion.test`;
  const response = await request.post('/api/users', {
    headers: await adminAuth(request),
    data: { email, password: PASSWORD, name: `Test ${role}`, role },
  });
  expect(response.status(), `création du compte ${role}`).toBe(201);
  return email;
};

/**
 * Contexte de navigation connecté à l'admin avec ce compte : jeton Payload en en-tête, reconnu
 * par l'API REST comme par les vues de l'admin (le cookie de session n'est pas renvoyé par les
 * requêtes d'API du contexte).
 */
const signedIn = async (
  browser: Browser,
  request: APIRequestContext,
  email: string,
): Promise<Page> => {
  const login = await request.post('/api/users/login', { data: { email, password: PASSWORD } });
  expect(login.status(), `connexion ${email}`).toBe(200);
  const body: unknown = await login.json();
  const token = isRecord(body) && typeof body.token === 'string' ? body.token : '';
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    extraHTTPHeaders: { authorization: `JWT ${token}` },
  });
  return context.newPage();
};

const amountOf = async (page: Page, testId: string): Promise<number> =>
  Number(await page.getByTestId(testId).getAttribute('data-amount'));

/** Calcul « à la main » à partir des écritures de l'API : part du prestataire sur la journée. */
const partnerDueFromEntries = async (request: APIRequestContext, partnerId: number) => {
  const day = today();
  const body = await adminGet(
    request,
    `/api/commissionEntries?where[partner][equals]=${partnerId}&where[occurredAt][greater_than_equal]=${day}T00:00:00.000Z&where[occurredAt][less_than_equal]=${day}T23:59:59.999Z&limit=0&pagination=false&depth=0`,
  );
  return docsOf(body).reduce<number>(
    (sum, entry) =>
      sum + (isRecord(entry) && typeof entry.partnerAmount === 'number' ? entry.partnerAmount : 0),
    0,
  );
};

const bookingByReference = async (request: APIRequestContext, reference: string) => {
  const body = await adminGet(
    request,
    `/api/bookings?where[reference][equals]=${reference}&depth=0`,
  );
  const booking = docsOf(body)[0];
  if (!isRecord(booking) || typeof booking.id !== 'number') throw new Error('Réservation absente');
  const lines = Array.isArray(booking.lines) ? booking.lines.filter(isRecord) : [];
  const partner = lines[0]?.partner;
  if (typeof partner !== 'number') throw new Error('Ligne sans prestataire');
  return { id: booking.id, lines, partnerId: partner };
};

test.describe('US5 — relevés prestataires et reversements @checkout @us5', () => {
  test('finance : commissions d’une réservation, relevé, reversement et export', async ({
    page,
    request,
    browser,
  }) => {
    test.setTimeout(240_000);
    const reference = await payBookingInFull(page, request, {
      firstName: uniqueName('Releve'),
      inDays: 50,
    });
    const booking = await bookingByReference(request, reference);
    const finance = await signedIn(browser, request, await createUser(request, 'finance'));

    // Réservation : prestataire, taux figé, commission et part par ligne.
    await finance.goto(`/admin/collections/bookings/${booking.id}`);
    const lines = finance.getByTestId('booking-finance');
    await expect(lines).toBeVisible({ timeout: 30_000 });
    await expect(lines).toContainText('Hébergement');
    await expect(lines).toContainText('15 %');

    // Relevé du prestataire sur la journée.
    const day = today();
    await finance.goto(`/admin/releves?prestataire=${booking.partnerId}&du=${day}&au=${day}`);
    await expect(finance.getByRole('heading', { name: 'Relevés prestataires' })).toBeVisible();
    await expect(finance.getByText(reference).first()).toBeVisible();
    await expectNoAxeViolations(finance, 'relevé prestataire', { include: '.gutter--left' });
    // Totaux égaux au calcul sur les écritures (d'autres tests paient en parallèle : on relit).
    await expect(async () => {
      await finance.reload();
      const expected = await partnerDueFromEntries(request, booking.partnerId);
      expect(await amountOf(finance, 'total-partner')).toBe(expected);
    }).toPass({ timeout: 30_000 });
    expect(await amountOf(finance, 'total-commission')).toBeGreaterThan(0);
    const paidBefore = await amountOf(finance, 'total-paid-out');

    // Reversement enregistré : déduit du reste à reverser.
    const payoutReference = `WAVE-${uniqueName('R')}`;
    await finance.getByLabel('Montant versé (FCFA)').fill('1000');
    await finance.getByLabel('Moyen').selectOption('wave');
    await finance.getByLabel('Référence du versement').fill(payoutReference);
    await finance.getByRole('button', { name: 'Enregistrer le reversement' }).click();
    await expect(finance.locator('.gutter--left').getByRole('status')).toHaveText(
      'Reversement enregistré.',
      {
        timeout: 15_000,
      },
    );
    await expect(finance.getByTestId('payouts')).toContainText(payoutReference);
    expect(await amountOf(finance, 'total-paid-out')).toBe(paidBefore + 1000);
    expect(await amountOf(finance, 'total-balance')).toBe(
      (await amountOf(finance, 'total-partner')) - (await amountOf(finance, 'total-paid-out')),
    );

    // Export tableur : CSV `;` UTF-8 avec BOM.
    const exportPath = await finance
      .getByRole('link', { name: 'Exporter en tableur (CSV)' })
      .getAttribute('href');
    const csv = await finance.request.get(exportPath ?? '');
    expect(csv.status()).toBe(200);
    expect(csv.headers()['content-type']).toContain('text/csv');
    expect(csv.headers()['content-disposition']).toMatch(/attachment; filename="releve-.+\.csv"/);
    const text = (await csv.body()).toString('utf8');
    expect(text.startsWith('﻿')).toBe(true);
    expect(text).toContain(`;${reference};`);
    expect(text).toContain(payoutReference);
    await finance.context().close();
  });

  test('operations : ni montants à reverser, ni relevé, ni export ; la réservation reste modifiable', async ({
    page,
    request,
    browser,
  }) => {
    test.setTimeout(240_000);
    const reference = await payBookingInFull(page, request, {
      firstName: uniqueName('Operations'),
      inDays: 50,
    });
    const booking = await bookingByReference(request, reference);
    const before = booking.lines[0];
    expect(typeof before?.partnerAmount).toBe('number');
    const operations = await signedIn(browser, request, await createUser(request, 'operations'));

    // L'API ne renvoie ni la commission ni la part du prestataire.
    const read = await operations.request.get(`/api/bookings/${booking.id}?depth=0`);
    expect(read.status()).toBe(200);
    const body: unknown = await read.json();
    const lines = isRecord(body) && Array.isArray(body.lines) ? body.lines.filter(isRecord) : [];
    expect(lines[0]?.lineTotal).toBeGreaterThan(0);
    expect(lines[0]).not.toHaveProperty('partnerAmount');
    expect(lines[0]).not.toHaveProperty('commissionAmount');

    // Confirmer la disponibilité (formulaire de l'admin) ne perd pas les montants masqués.
    const update = await operations.request.patch(`/api/bookings/${booking.id}`, {
      data: { lines: lines.map((line) => ({ ...line, availabilityStatus: 'confirmed' })) },
    });
    expect(update.status()).toBe(200);
    const after = (await bookingByReference(request, reference)).lines[0];
    expect(after?.availabilityStatus).toBe('confirmed');
    expect(after?.partnerAmount).toBe(before?.partnerAmount);
    expect(after?.commissionAmount).toBe(before?.commissionAmount);

    // Ni écritures, ni relevé, ni export.
    expect((await operations.request.get('/api/commissionEntries?limit=1')).status()).toBe(403);
    const day = today();
    const csv = await operations.request.get(
      `/api/admin/statements/${booking.partnerId}?du=${day}&au=${day}`,
    );
    expect(csv.status()).toBe(403);
    await operations.goto(`/admin/releves?prestataire=${booking.partnerId}&du=${day}&au=${day}`);
    await expect(operations).not.toHaveURL(/\/releves/, { timeout: 30_000 });
    await expect(operations.getByRole('link', { name: 'Relevés prestataires' })).toHaveCount(0);
    await operations.goto(`/admin/collections/bookings/${booking.id}`);
    await expect(operations.locator('#field-reference')).toBeVisible({ timeout: 30_000 });
    await expect(operations.getByTestId('booking-finance')).toHaveCount(0);
    await operations.context().close();
  });
});
