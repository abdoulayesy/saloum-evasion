import { expect, test } from '@playwright/test';
import { observeInteractions, takeWorstInteraction, throttleCpu } from './support/perf';
import { fillRequiredFields, uniqueName, waitAntiBotDelay } from './support/request';

// T164 (perf-a11y CHK009) : INP de laboratoire ≤ 200 ms pour chaque interaction clé, sur
// Android 360 avec processeur ralenti ×4 (Event Timing, Chromium).
const BUDGET_MS = 200;

test.describe('INP des interactions clés (processeur ×4)', () => {
  test.beforeEach(({ browserName, isMobile }) => {
    test.skip(browserName !== 'chromium' || !isMobile, 'Event Timing : Chromium mobile');
  });

  test('filtres : ouvrir puis appliquer', async ({ page }) => {
    await page.goto('/fr/sejours', { waitUntil: 'networkidle' });
    await throttleCpu(page, 4);
    await observeInteractions(page);
    await page.getByRole('button', { name: 'Filtrer' }).click();
    expect(await takeWorstInteraction(page), 'ouvrir le panneau').toBeLessThanOrEqual(BUDGET_MS);
    const sheet = page.getByRole('dialog', { name: 'Filtrer les séjours' });
    await sheet.getByRole('button', { name: 'Week-end (1 à 2 nuits)' }).click();
    await sheet.getByRole('button', { name: 'Voir 1 séjour' }).click();
    expect(await takeWorstInteraction(page), 'appliquer').toBeLessThanOrEqual(BUDGET_MS);
  });

  test('galerie : photo suivante', async ({ page }) => {
    await page.goto('/fr/sejours/week-end-bolong-ndangane', { waitUntil: 'networkidle' });
    await throttleCpu(page, 4);
    await observeInteractions(page);
    await page.getByRole('button', { name: 'Photo suivante' }).click();
    expect(await takeWorstInteraction(page)).toBeLessThanOrEqual(BUDGET_MS);
  });

  test('ajouter à la demande', async ({ page }) => {
    await page.goto('/fr/experiences/mangrove-et-iles/excursion-pirogue-bolongs', {
      waitUntil: 'networkidle',
    });
    await throttleCpu(page, 4);
    await observeInteractions(page);
    await page
      .locator('[data-sticky-action-bar]')
      .getByRole('link', { name: 'Ajouter à ma demande' })
      .click();
    expect(await takeWorstInteraction(page)).toBeLessThanOrEqual(BUDGET_MS);
  });

  test('envoyer la demande', async ({ page }) => {
    await page.goto('/fr/demande', { waitUntil: 'networkidle' });
    await fillRequiredFields(page, { firstName: uniqueName('Inp') });
    await waitAntiBotDelay(page);
    await throttleCpu(page, 4);
    await observeInteractions(page);
    await page.getByRole('button', { name: 'Envoyer ma demande' }).click();
    expect(await takeWorstInteraction(page)).toBeLessThanOrEqual(BUDGET_MS);
    await expect(page.getByRole('heading', { name: 'Demande envoyée' })).toBeVisible();
  });
});
