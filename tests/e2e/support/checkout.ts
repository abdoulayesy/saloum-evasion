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

export type FakeOutcome = 'Réussir' | 'Solde insuffisant' | 'Refuser' | 'Annuler';

/** Sur la page de paiement simulée, choisit l'issue. */
export const payWithFake = async (page: Page, outcome: FakeOutcome) => {
  await expect(page).toHaveURL(/\/dev\/fake-gateway\?ref=/);
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
