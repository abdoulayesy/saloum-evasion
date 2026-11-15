import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, type Page } from '@playwright/test';

// Aides des tests de la demande de séjour (phase 8). Les e-mails sont écrits par le serveur de
// test dans `test-results/outbox` (EMAIL_OUTBOX_DIR, playwright.config.ts).

export const OUTBOX_DIR = join(process.cwd(), 'test-results', 'outbox');

/** Date AAAA-MM-JJ dans `days` jours (Dakar = UTC). */
export const isoInDays = (days: number): string =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

/** Prénom unique pour retrouver la demande et son e-mail. */
export const uniqueName = (prefix = 'Awa'): string =>
  `${prefix}${Math.random().toString(36).slice(2, 8)}`;

export type ContactInput = { firstName: string; whatsapp?: string; arrival?: string };

/** Remplit les champs obligatoires (le formulaire exige 3 s avant l'envoi : anti-robot). */
export const fillRequiredFields = async (page: Page, input: ContactInput): Promise<void> => {
  await page.getByLabel(/^(Arrivée|Arrival)$/).fill(input.arrival ?? isoInDays(30));
  await page.getByLabel(/^(Prénom|First name)$/).fill(input.firstName);
  await page.locator('#whatsappLocal').fill(input.whatsapp ?? '77 123 45 67');
  await page.getByRole('checkbox', { name: /J’accepte|I agree/ }).check();
};

/** Attend que le délai anti-robot de 3 s soit écoulé depuis l'affichage du formulaire. */
export const waitAntiBotDelay = async (page: Page): Promise<void> => {
  const startedAt = Number(await page.locator('input[name="startedAt"]').inputValue());
  const wait = startedAt + 3200 - Date.now();
  if (wait > 0) await page.waitForTimeout(wait);
};

type OutboxMessage = { to: string; subject: string; text: string; html: string };

/** E-mail de l'équipe dont l'objet contient `needle`, attendu jusqu'à 10 s. */
export const findOutboxMessage = async (needle: string): Promise<OutboxMessage> => {
  let found: OutboxMessage | undefined;
  await expect
    .poll(
      async () => {
        const files = await readdir(OUTBOX_DIR).catch(() => []);
        for (const file of files) {
          const value: unknown = JSON.parse(await readFile(join(OUTBOX_DIR, file), 'utf8'));
          if (
            typeof value === 'object' &&
            value !== null &&
            'subject' in value &&
            typeof value.subject === 'string' &&
            value.subject.includes(needle) &&
            'to' in value &&
            typeof value.to === 'string' &&
            'text' in value &&
            typeof value.text === 'string' &&
            'html' in value &&
            typeof value.html === 'string'
          ) {
            found = { to: value.to, subject: value.subject, text: value.text, html: value.html };
            return true;
          }
        }
        return false;
      },
      { timeout: 10_000, message: `e-mail « ${needle} »` },
    )
    .toBe(true);
  if (!found) throw new Error(`e-mail introuvable : ${needle}`);
  return found;
};
