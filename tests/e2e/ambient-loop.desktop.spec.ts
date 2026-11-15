import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

// T131 : boucle d'ambiance du héro de l'accueil. La source (MP4 hébergé ou rendu « low » de
// Mux) est remplacée par une petite vidéo WebM (lisible par Chromium, présente même sans la
// vidéo fournie par l'équipe) ; on vérifie QUAND elle est chargée.
const LOOP = /(\/videos\/demo\/ambient-loop\.mp4|^https:\/\/stream\.mux\.com\/[^/]+\/low\.mp4)$/;
const fixture = readFileSync(join(process.cwd(), 'tests', 'e2e', 'fixtures', 'ambient-loop.webm'));

const serveLoop = async (page: Page): Promise<string[]> => {
  const requests: string[] = [];
  await page.route(LOOP, async (route) => {
    requests.push(route.request().url());
    await route.fulfill({ status: 200, contentType: 'video/webm', body: fixture });
  });
  return requests;
};

test.describe('boucle d’ambiance', () => {
  test('ordinateur : boucle muette après chargement, bouton pause opérationnel', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Ordinateur seulement');
    const requests = await serveLoop(page);
    await page.goto('/fr', { waitUntil: 'load' });
    const video = page.locator('video[data-ambient-loop]');
    await expect(video).toHaveAttribute('aria-hidden', 'true');
    await expect(video).toHaveJSProperty('muted', true);
    expect(requests).toHaveLength(1);
    const pause = page.getByRole('button', { name: 'Pause' });
    await expect(pause).toBeVisible();
    await pause.click();
    await expect(page.getByRole('button', { name: 'Lecture' })).toBeVisible();
    await expect(video).toHaveJSProperty('paused', true);
    // L'image reste l'élément LCP : elle est toujours présente et prioritaire.
    await expect(
      page.locator('section[aria-labelledby="accueil-titre"] img').first(),
    ).toHaveAttribute('fetchpriority', 'high');
  });

  test('aucune boucle avec mouvement réduit', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Ordinateur seulement');
    const requests = await serveLoop(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/fr', { waitUntil: 'networkidle' });
    await expect(page.locator('video[data-ambient-loop]')).toHaveCount(0);
    expect(requests).toEqual([]);
  });

  test('aucune boucle avec Save-Data', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Ordinateur seulement');
    const requests = await serveLoop(page);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'connection', { value: { saveData: true } });
    });
    await page.goto('/fr', { waitUntil: 'networkidle' });
    await expect(page.locator('video[data-ambient-loop]')).toHaveCount(0);
    expect(requests).toEqual([]);
  });

  test('mobile : aucune boucle, aucun octet vidéo', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile seulement');
    const requests = await serveLoop(page);
    await page.goto('/fr', { waitUntil: 'networkidle' });
    await expect(page.locator('video')).toHaveCount(0);
    expect(requests).toEqual([]);
  });
});
