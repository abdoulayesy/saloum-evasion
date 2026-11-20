import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { applyNetwork } from './network';
import { OUTBOX_DIR, isoInDays } from './request';

// Aides E2E du tunnel de commande (002, T008). Données : `pnpm seed` puis `pnpm seed:checkout`
// (écolodge, expériences, table, transferts et séjour vendables). Passerelle `fake` et file de
// tâches déclenchée avec `CRON_SECRET` (variables du webServer de playwright.config.ts).

export const CRON_SECRET = 'cron-de-test';

/** Profil réseau 3G sur le projet `android-360-3g` (constitution I : parcours en 3G). */
export const useProjectNetwork = async (page: Page, projectName: string) => {
  if (projectName === 'android-360-3g') await applyNetwork(page, '3g');
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Chemin de la fiche du premier hébergement vendable (API publique de Payload). */
export const bookableAccommodationPath = async (
  request: APIRequestContext,
  locale: 'fr' | 'en' = 'fr',
) => {
  const response = await request.get(
    `/api/accommodations?where[bookable][equals]=true&locale=${locale}&depth=0&limit=1&sort=id`,
  );
  const body: unknown = await response.json();
  const docs = isRecord(body) && Array.isArray(body.docs) ? body.docs : [];
  const first: unknown = docs[0];
  const slug =
    isRecord(first) && isRecord(first.seo) && typeof first.seo.slug === 'string'
      ? first.seo.slug
      : null;
  if (!slug) throw new Error('Aucun hébergement vendable : lancer `pnpm seed:checkout`.');
  return locale === 'fr' ? `/fr/hebergements/${slug}` : `/en/accommodation/${slug}`;
};

/** Ajoute l'hébergement de la fiche ouverte au panier (dates dans `inDays` jours). */
export const addAccommodation = async (page: Page, inDays = 40, nights = 2) => {
  const form = page.locator('#reserver');
  await form.getByLabel(/^(Arrivée|Arrival)$/).fill(isoInDays(inDays));
  await form.getByLabel(/^(Départ|Departure)$/).fill(isoInDays(inDays + nights));
  await form.getByRole('button', { name: /Ajouter au panier|Add to cart/ }).click();
  await expect(page).toHaveURL(/\/(fr\/panier|en\/cart)\?ajoute=/, { timeout: 30_000 });
};

export type ContactDetails = {
  firstName: string;
  lastName?: string;
  whatsapp?: string;
  email?: string;
};

export const fillContact = async (page: Page, contact: ContactDetails) => {
  await page.getByLabel(/^(Prénom|First name)$/).fill(contact.firstName);
  await page.getByLabel(/^(Nom|Last name)$/).fill(contact.lastName ?? 'Diop');
  await page.locator('#whatsappLocal').fill(contact.whatsapp ?? '77 123 45 67');
  await page
    .getByLabel(/^(E-mail|Email)$/)
    .fill(contact.email ?? `${contact.firstName.toLowerCase()}@example.sn`);
  await page
    .getByRole('checkbox', { name: /J’accepte que mes données|I agree that my data/ })
    .check();
};

export type FakeOutcome =
  'Réussir' | 'Solde insuffisant' | 'Refuser' | 'Annuler' | 'Délai dépassé' | 'Erreur technique';

/** Sur la page de paiement simulée, choisit l'issue. */
export const payWithFake = async (page: Page, outcome: FakeOutcome) => {
  // Action serveur + redirection : jusqu'à 30 s quand les projets tournent en parallèle.
  await expect(page).toHaveURL(/\/dev\/fake-gateway\?ref=/, { timeout: 30_000 });
  await page.getByRole('button', { name: outcome, exact: true }).click();
};

/** Exécute la file de tâches (envoi des notifications). */
export const runJobs = async (request: APIRequestContext) => {
  const response = await request.get('/api/jobs/run', {
    headers: { authorization: `Bearer ${CRON_SECRET}` },
  });
  expect(response.status()).toBe(200);
};

type OutboxFile = { file: string; content: Record<string, unknown> };

/** Messages de la boîte d'envoi de test contenant `needle` (e-mail ou WhatsApp). */
export const outboxContaining = async (needle: string): Promise<OutboxFile[]> => {
  const files = await readdir(OUTBOX_DIR).catch(() => []);
  const matches: OutboxFile[] = [];
  for (const file of files) {
    const raw = await readFile(join(OUTBOX_DIR, file), 'utf8').catch(() => '');
    if (!raw.includes(needle)) continue;
    const parsed: unknown = JSON.parse(raw);
    if (isRecord(parsed)) matches.push({ file, content: parsed });
  }
  return matches;
};

/** Le résumé du panier (cookie lisible) : « nombre.total ». */
export const readCartSummary = async (page: Page): Promise<string | null> => {
  const cookies = await page.context().cookies();
  return cookies.find((cookie) => cookie.name === 'se_cart_summary')?.value ?? null;
};

export const expectNoindex = async (
  page: Page,
  response: { headers: () => Record<string, string> } | null,
) => {
  expect(response?.headers()['x-robots-tag']).toContain('noindex');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
};

/** Panier d'un hébergement, coordonnées saisies : renvoie sur l'étape paiement. */
export const reachPaymentPage = async (
  page: Page,
  request: APIRequestContext,
  { firstName, inDays = 45 }: { firstName: string; inDays?: number },
) => {
  await page.goto(await bookableAccommodationPath(request));
  await addAccommodation(page, inDays, 2);
  await page.goto('/fr/commande/coordonnees');
  await fillContact(page, { firstName });
  await page.getByRole('button', { name: 'Continuer : paiement' }).click();
  await expect(page).toHaveURL(/\/fr\/commande\/paiement$/, { timeout: 30_000 });
};

/** File de tâches exécutée à une date de référence (relances ; passerelle factice uniquement). */
export const runJobsAt = async (request: APIRequestContext, at: Date) => {
  const response = await request.get(`/api/jobs/run?now=${at.toISOString()}`, {
    headers: { authorization: `Bearer ${CRON_SECRET}` },
  });
  expect(response.status()).toBe(200);
};

/** Premier lien de la boîte d'envoi qui correspond à `pattern` (e-mail le plus récent d'abord). */
export const linkInOutbox = async (needle: string, pattern: RegExp): Promise<string | null> => {
  const messages = await outboxContaining(needle);
  for (const message of messages.reverse()) {
    const found = pattern.exec(String(message.content.text ?? ''))?.[0];
    if (found) return found;
  }
  return null;
};

/** Réservation payée en totalité (hébergement à `inDays` jours) ; renvoie sa référence. */
export const payBookingInFull = async (
  page: Page,
  request: APIRequestContext,
  { firstName, inDays }: { firstName: string; inDays: number },
): Promise<string> => {
  await reachPaymentPage(page, request, { firstName, inDays });
  await page.getByRole('radio', { name: 'Wave' }).check();
  await page.getByRole('checkbox', { name: /accepte les conditions d’annulation/ }).check();
  // Avec un acompte possible, le dernier bouton est « Payer le total de… ».
  await page
    .getByRole('button', { name: /^Payer/ })
    .last()
    .click();
  await payWithFake(page, 'Réussir');
  await expect(page).toHaveURL(/\/fr\/reservation\/se-[a-z2-9]{6}/, { timeout: 30_000 });
  await expect(page.getByText('Payée')).toBeVisible({ timeout: 15_000 });
  return (await page.getByTestId('booking-reference').textContent())?.trim() ?? '';
};

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@saloum-evasion.test';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'demo-admin-password';

/** En-tête d'autorisation de l'API REST de Payload pour le compte administrateur du seed. */
export const adminAuth = async (request: APIRequestContext): Promise<Record<string, string>> => {
  const response = await request.post('/api/users/login', {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(response.status(), 'connexion administrateur').toBe(200);
  const body: unknown = await response.json();
  const token = isRecord(body) && typeof body.token === 'string' ? body.token : '';
  return { authorization: `JWT ${token}` };
};

/**
 * Modification par l'API REST en administrateur. Les projets se connectent en parallèle avec le
 * même compte : Payload stocke les sessions sur l'utilisateur et une écriture concurrente peut
 * en perdre une (403). On se reconnecte alors une fois.
 */
export const adminPatch = async (
  request: APIRequestContext,
  path: string,
  data: Record<string, unknown>,
): Promise<number> => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await request.patch(path, { headers: await adminAuth(request), data });
    if (response.status() !== 401 && response.status() !== 403) return response.status();
  }
  return 403;
};

/** Lecture par l'API REST en administrateur, avec reconnexion (voir `adminPatch`). */
export const adminGet = async (request: APIRequestContext, path: string): Promise<unknown> => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await request.get(path, { headers: await adminAuth(request) });
    if (response.status() !== 401 && response.status() !== 403) return response.json();
  }
  return null;
};
