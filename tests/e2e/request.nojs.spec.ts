import { expect, test } from '@playwright/test';
import { readSeo } from './support/seo';
import {
  fillRequiredFields,
  findOutboxMessage,
  uniqueName,
  waitAntiBotDelay,
} from './support/request';

// T151 (projet nojs) : demande envoyée sans JavaScript → redirection 303 vers la confirmation ;
// pages de demande et de confirmation en noindex et absentes du sitemap.
test.describe('demande de séjour sans JavaScript', () => {
  test('envoi → 303 vers la confirmation avec la référence', async ({ page }) => {
    const firstName = uniqueName('Ibra');
    await page.goto('/fr/demande?experience=excursion-pirogue-bolongs');
    await expect(
      page.getByRole('checkbox', { name: /Excursion en pirogue dans les bolongs/ }),
    ).toBeChecked();
    await fillRequiredFields(page, { firstName });
    await waitAntiBotDelay(page);
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.request().method() === 'POST'),
      page.getByRole('button', { name: 'Envoyer ma demande' }).click(),
    ]);
    expect(response.status()).toBe(303);
    await expect(page).toHaveURL(/\/fr\/demande\/merci\?ref=SE-\d{8}-[A-Z0-9]{4}$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Merci, demande reçue');
    await expect(page.getByText('Excursion en pirogue dans les bolongs')).toBeVisible();
    await findOutboxMessage(firstName);
  });

  test('sans JavaScript, le navigateur bloque l’envoi incomplet (champs requis)', async ({
    page,
  }) => {
    await page.goto('/fr/demande');
    await page.getByLabel('Prénom').fill('Fatou');
    await waitAntiBotDelay(page);
    await page.getByRole('button', { name: 'Envoyer ma demande' }).click();
    await expect(page).toHaveURL(/\/fr\/demande$/);
    expect(
      await page
        .getByLabel('Arrivée')
        .evaluate((input) => input instanceof HTMLInputElement && input.validity.valueMissing),
    ).toBe(true);
    await expect(page.getByLabel('Prénom')).toHaveValue('Fatou');
  });

  test('noindex, sans JSON-LD, hors sitemap ; route interne introuvable', async ({
    page,
    request,
  }) => {
    for (const path of [
      '/fr/demande',
      '/en/request',
      '/fr/demande/merci',
      '/en/request/thank-you',
    ]) {
      await page.goto(path);
      const seo = await readSeo(page);
      expect(seo.robots ?? '', path).toContain('noindex');
      expect(seo.jsonLd, path).toEqual([]);
      expect(seo.h1, path).toHaveLength(1);
    }
    const xml = await (await request.get('/sitemap.xml')).text();
    expect(xml).not.toMatch(/\/(demande|request)(\/|<)/);
    expect((await request.get('/fr/request-form')).status()).toBe(404);
  });
});
