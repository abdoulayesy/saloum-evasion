import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations } from './support/a11y';
import { expectNoHorizontalScroll, expectTouchTargets, setTextZoom } from './support/mobile';

// T129 : page film à 360 px. Les flux Mux sont interceptés (aucun accès réseau réel) : on
// vérifie QUAND le lecteur les demande, pas le décodage vidéo.
const FILM = '/fr/film-immersion';
const MUX = /^https:\/\/(stream|image)\.mux\.com\//;

const recordMux = async (page: Page): Promise<string[]> => {
  const requests: string[] = [];
  // Le lecteur HLS natif (Safari, Chrome récent) peut échapper à page.route : on observe aussi
  // toutes les requêtes émises par la page.
  page.on('request', (request) => {
    if (MUX.test(request.url()) && !requests.includes(request.url())) requests.push(request.url());
  });
  await page.route(MUX, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/vnd.apple.mpegurl',
      body: '#EXTM3U\n',
    });
  });
  return requests;
};

const playButton = (page: Page) => page.getByRole('button', { name: /^Lire le film/ });

test.describe('film', () => {
  test('aucun octet vidéo avant le clic, flux HLS après le clic', async ({ page }) => {
    const requests = await recordMux(page);
    await page.goto(FILM, { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    expect(requests, 'requêtes Mux avant le clic').toEqual([]);
    await expect(page.locator('video')).toHaveCount(0);
    await playButton(page).click();
    await expect(page.locator('video')).toHaveCount(1);
    await expect.poll(() => requests.some((url) => url.endsWith('.m3u8'))).toBe(true);
  });

  test('sous-titres FR et EN, français par défaut', async ({ page }) => {
    await recordMux(page);
    await page.goto(FILM);
    await playButton(page).click();
    const tracks = page.locator('video track[kind="subtitles"]');
    await expect(tracks).toHaveCount(2);
    await expect(page.locator('video track[srclang="fr"]')).toHaveAttribute('default', '');
    await expect(page.locator('video track[srclang="en"]')).not.toHaveAttribute('default', '');
  });

  test('?t= : le lecteur démarre au chapitre demandé', async ({ page }) => {
    await recordMux(page);
    await page.goto(`${FILM}?t=125`);
    await playButton(page).click();
    await expect(page.locator('video')).toHaveAttribute('data-start-at', '125');
  });

  test('chapitre : lien ?t= qui lance la lecture au bon endroit', async ({ page }) => {
    await recordMux(page);
    await page.goto(FILM);
    const chapters = page.getByRole('navigation', { name: 'Chapitres du film' });
    await expect(chapters.getByRole('link')).toHaveCount(4);
    // Troisième chapitre (125 s) : sélectionné par son rang, les titres des chapitres changent
    // avec le contenu de la base (démonstration, puis film réel).
    await chapters.getByRole('link').nth(2).click();
    await expect(page).toHaveURL(/\?t=125$/);
    await expect(page.locator('video')).toHaveAttribute('data-start-at', '125');
  });

  test('pas de lecture automatique, même avec mouvement réduit ou Save-Data', async ({ page }) => {
    const requests = await recordMux(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'connection', { value: { saveData: true } });
    });
    await page.goto(FILM, { waitUntil: 'networkidle' });
    await expect(page.locator('video')).toHaveCount(0);
    expect(requests).toEqual([]);
  });

  test('clavier : Entrée sur le bouton lecture donne le focus au lecteur', async ({ page }) => {
    await recordMux(page);
    await page.goto(FILM);
    await playButton(page).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('video')).toBeFocused();
  });

  test('axe, cibles tactiles, zoom 200 %, sans défilement horizontal', async ({ page }) => {
    await recordMux(page);
    await page.goto(FILM);
    await expectNoAxeViolations(page, 'film');
    await expectTouchTargets(page);
    await expectNoHorizontalScroll(page);
    await setTextZoom(page, 2);
    await expectNoHorizontalScroll(page);
    await playButton(page).click();
    await expectNoAxeViolations(page, 'film en lecture');
  });
});
