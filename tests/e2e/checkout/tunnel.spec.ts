import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from '../support/a11y';
import { expectNoHorizontalScroll } from '../support/mobile';

// T033 (contracts/routes-tunnel.md) : tunnel atteint par les URL traduites, jamais indexé, jamais
// en cache partagé ; routes internes inaccessibles ; pages publiques toujours statiques avec un
// panier en cours (le cookie n'est jamais lu au rendu des pages publiques).

const STAY = '/fr/sejours/week-end-bolong-ndangane';

test.describe('tunnel de commande @checkout', () => {
  for (const { path, title } of [
    { path: '/fr/panier', title: 'Votre panier' },
    { path: '/en/cart', title: 'Your cart' },
  ]) {
    test(`${path} : noindex, privé, sans cache partagé, accessible à 360 px`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      const headers = response?.headers() ?? {};
      expect(headers['x-robots-tag']).toContain('noindex');
      expect(headers['cache-control']).toContain('no-store');
      expect(headers['cache-control']).toContain('private');
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
      await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
      await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
      await expectNoHorizontalScroll(page);
      await expectNoAxeViolations(page, path);
    });
  }

  test('panier rendu à la demande : cookie d’un panier inconnu → « panier expiré »', async ({
    context,
    page,
    baseURL,
  }) => {
    await context.addCookies([
      { name: 'se_cart', value: 'BBBBBBBBBBBBBBBBBBBBBB', url: baseURL ?? 'http://localhost:3000' },
    ]);
    const response = await page.goto('/fr/panier');
    expect(response?.headers()['x-nextjs-prerender']).toBeUndefined();
    await expect(page.getByText('Votre panier a expiré')).toBeVisible();
  });

  test('routes internes du tunnel : 404', async ({ request }) => {
    for (const path of [
      '/fr/tunnel/cart',
      '/en/tunnel/checkout/details',
      '/fr/tunnel/booking/find',
    ]) {
      expect((await request.get(path)).status(), path).toBe(404);
    }
  });

  test('passerelle de test et file de tâches protégées', async ({ request }) => {
    expect((await request.get('/dev/fake-gateway?ref=inconnu')).status()).toBe(404);
    expect((await request.get('/api/jobs/run')).status()).toBe(401);
    const forged = await request.get('/api/jobs/run', {
      headers: { authorization: 'Bearer faux' },
    });
    expect(forged.status()).toBe(401);
  });

  test('étape sans panier : renvoi vers le panier', async ({ page }) => {
    await page.goto('/fr/commande/coordonnees');
    await expect(page).toHaveURL(/\/fr\/panier$/);
  });

  test('lien de réservation invalide : aucune indication sur la référence', async ({ page }) => {
    const response = await page.goto('/fr/reservation/se-ab23cd?k=faux');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ce lien n’est plus valide.');
    expect((await page.goto('/fr/reservation/pas-une-reference'))?.status()).toBe(404);
  });

  test('fiche séjour toujours prérendue avec un panier en cours', async ({ context, request }) => {
    const before = await request.get(STAY);
    await context.addCookies([
      { name: 'se_cart', value: 'AAAAAAAAAAAAAAAAAAAAAA', url: before.url() },
      { name: 'se_cart_summary', value: '2.95000', url: before.url() },
    ]);
    const after = await context.request.get(STAY);
    expect(after.status()).toBe(200);
    expect(after.headers()['x-nextjs-prerender']).toBe(before.headers()['x-nextjs-prerender']);
    expect(after.headers()['x-nextjs-prerender']).toBeTruthy();
    expect(after.headers()['cache-control']).not.toContain('private');
  });
});
