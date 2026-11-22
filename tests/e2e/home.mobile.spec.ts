import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from './support/a11y';
import {
  expectInThumbZone,
  expectNoHorizontalScroll,
  expectTouchTargets,
  setTextZoom,
} from './support/mobile';

// T097 : accueil à 360 px.
test.describe('accueil', () => {
  test('élément LCP = image principale, ≤ 120 Ko, en AVIF ou WebP', async ({
    page,
    isMobile,
    browserName,
  }) => {
    // Budget LCP de la constitution : profil mobile. (Sur grand écran, Chrome écarte du LCP les
    // visuels de démonstration en aplat de couleur, jugés de trop faible entropie.)
    // Lighthouse mesure sous Chromium ; WebKit applique d'autres règles d'éligibilité au LCP.
    test.skip(
      !isMobile || browserName !== 'chromium',
      'Budget LCP mesuré en profil mobile Chromium',
    );
    const images: { url: string; type: string; size: number }[] = [];
    page.on('response', async (response) => {
      if (!response.url().includes('/_next/image')) return;
      const body = await response.body().catch(() => Buffer.alloc(0));
      images.push({
        url: response.url(),
        type: response.headers()['content-type'] ?? '',
        size: body.length,
      });
    });
    await page.goto('/fr', { waitUntil: 'networkidle' });
    const lcp = await page.evaluate(
      () =>
        new Promise<{ tag: string; src: string }>((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const last = entries[entries.length - 1];
            const element = last && 'element' in last ? last.element : null;
            resolve({
              tag: element instanceof Element ? element.tagName : '',
              src: element instanceof HTMLImageElement ? element.currentSrc : '',
            });
          }).observe({ type: 'largest-contentful-paint', buffered: true });
        }),
    );
    expect(lcp.tag).toBe('IMG');
    const hero = images.find((image) => lcp.src.includes(new URL(image.url).search));
    expect(hero, 'requête de l’image LCP').toBeDefined();
    expect(hero?.type).toMatch(/image\/(avif|webp)/);
    expect(hero?.size ?? Infinity).toBeLessThanOrEqual(120 * 1024);
  });

  test('bouton de recherche dans la zone du pouce, formulaire accessible', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/fr');
    // Raccourci du héro sur téléphone ; dès 640 px la barre de recherche est déjà visible.
    if (isMobile) {
      const button = page.getByRole('link', { name: 'Trouver mon séjour' });
      await expectInThumbZone(button);
      await button.click();
    }
    await expect(
      page.getByRole('heading', { name: 'Trouver mon séjour', level: 2 }),
    ).toBeInViewport();
  });

  test('axe, cibles tactiles, pas de défilement horizontal, zoom 200 %', async ({ page }) => {
    await page.goto('/fr');
    await expectNoAxeViolations(page, 'accueil');
    await expectTouchTargets(page);
    await expectNoHorizontalScroll(page);
    await setTextZoom(page, 2);
    await expectNoHorizontalScroll(page);
  });

  test('page utile même si la vidéo est bloquée', async ({ page }) => {
    await page.route(/mux\.com|\.m3u8/, (route) => route.abort());
    await page.goto('/fr');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Partez vendredi/ })).toBeVisible();
    await expect(page.getByText('Séjours signature · tout compris')).toBeVisible();
  });

  test('en-tête transparent sur l’accueil seulement, y compris après navigation sans rechargement', async ({
    page,
  }) => {
    await page.goto('/fr', { waitUntil: 'networkidle' });
    const header = page.locator('header.site-header');
    await expect(header).toHaveCSS('position', 'absolute');
    // Lien du pied de page (next/link) : navigation côté client, <head> conservé.
    await page.locator('footer').getByRole('link', { name: 'Destinations' }).click();
    await expect(page).toHaveURL(/\/fr\/destinations$/);
    await expect(header).toHaveCSS('position', 'static');
    await expect(header).toHaveCSS('background-color', 'rgb(15, 42, 36)');
    await page.goBack();
    await expect(page).toHaveURL(/\/fr$/);
    await expect(header).toHaveCSS('position', 'absolute');
  });
});
