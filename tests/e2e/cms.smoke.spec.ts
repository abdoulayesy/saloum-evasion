import { expect, test, type APIRequestContext } from '@playwright/test';

// T063 (projet desktop) : admin protégé et non indexé, API publique fermée aux demandes,
// règles de publication appliquées côté serveur. Nécessite la base migrée et le seed.
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@saloum-evasion.test';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'demo-admin-password';

// Réservée au projet desktop (playwright.config.ts, ADMIN_SPECS) : dérogation D-T6b.

/** Jeton de session (le cookie est `Secure` en production, donc absent en HTTP local). */
const login = async (request: APIRequestContext): Promise<string> => {
  const response = await request.post('/api/users/login', {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(response.status(), 'connexion API').toBe(200);
  const body: unknown = await response.json();
  const token = typeof body === 'object' && body !== null && 'token' in body ? body.token : null;
  expect(typeof token).toBe('string');
  return typeof token === 'string' ? token : '';
};

const errorMessages = async (response: { json: () => Promise<unknown> }): Promise<string> =>
  JSON.stringify(await response.json());

test.describe('CMS', () => {
  test('/admin : noindex (en-tête et méta) et bloqué dans robots.txt', async ({
    page,
    request,
  }) => {
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Disallow: /admin');
    const response = await page.goto('/admin');
    expect(response?.headers()['x-robots-tag']).toContain('noindex');
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content', /noindex/);
  });

  test('connexion à l’admin avec un compte de l’équipe', async ({ page }) => {
    await page.goto('/admin/login');
    await page.locator('input[name="email"]').fill(ADMIN_EMAIL);
    await page.locator('input[name="password"]').fill(ADMIN_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/admin\/?$/);
    await expect(page.getByText('Séjours signature').first()).toBeVisible();
  });

  test('création d’une demande via l’API publique refusée', async ({ request }) => {
    const response = await request.post('/api/requests', {
      data: {
        firstName: 'Test',
        whatsapp: '+221771234567',
        arrivalDate: '2030-01-01',
        adults: 2,
        locale: 'fr',
        consentAt: new Date().toISOString(),
        submissionId: crypto.randomUUID(),
      },
    });
    expect(response.status()).toBe(403);
  });

  test('brouillons invisibles et lecture publique limitée aux contenus publiés', async ({
    request,
  }) => {
    const response = await request.get('/api/stays?draft=true&limit=50');
    expect(response.status()).toBe(200);
    const body: unknown = await response.json();
    const docs =
      typeof body === 'object' && body !== null && 'docs' in body && Array.isArray(body.docs)
        ? body.docs
        : [];
    expect(docs.length).toBeGreaterThan(0);
    for (const doc of docs) expect(doc).toMatchObject({ _status: 'published' });
  });

  test('publication refusée : texte trop court et title SEO déjà utilisé', async ({
    playwright,
    baseURL,
  }) => {
    const request = await playwright.request.newContext({ baseURL });
    const token = await login(request);
    const response = await request.post('/api/stays?locale=fr', {
      headers: { Authorization: `JWT ${token}` },
      data: {
        _status: 'published',
        title: 'Séjour de test des règles',
        summary: 'Résumé',
        durationNights: 2,
        body: {
          root: {
            type: 'root',
            version: 1,
            children: [
              {
                type: 'paragraph',
                version: 1,
                children: [{ type: 'text', version: 1, text: 'Trop court pour publier.' }],
              },
            ],
          },
        },
        seo: {
          metaTitle: 'Week-end bolong à Ndangane | Saloum Évasion',
          metaDescription: 'Description de test unique pour ce contrôle.',
        },
      },
    });
    expect(response.status()).toBe(400);
    const errors = await errorMessages(response);
    expect(errors).toMatch(/300 au minimum/);
    expect(errors).toMatch(/déjà utilisé/);
    await request.dispose();
  });
});
