import { expect, test, type APIRequestContext } from '@playwright/test';

// T158 (projet desktop-admin) : une fiche publiée en français seulement → le sélecteur EN mène
// à la page parente anglaise, avec un avis « pas encore disponible ». Le contenu créé est
// supprimé à la fin.

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@saloum-evasion.test';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'demo-admin-password';

type Json = Record<string, unknown>;
const isJson = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const auth = (jwt: string) => ({ Authorization: `JWT ${jwt}` });

const login = async (request: APIRequestContext): Promise<string> => {
  const response = await request.post('/api/users/login', {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const body: unknown = await response.json();
  return isJson(body) && typeof body.token === 'string' ? body.token : '';
};

const firstId = async (request: APIRequestContext, jwt: string, query: string): Promise<number> => {
  const body: unknown = await (await request.get(`/api/${query}`, { headers: auth(jwt) })).json();
  const docs = isJson(body) && Array.isArray(body.docs) ? body.docs : [];
  const [doc] = docs;
  return isJson(doc) && typeof doc.id === 'number' ? doc.id : 0;
};

/**
 * Après suppression d'un contenu de test : redemande toutes les pages du sitemap (listes,
 * destinations, accueil peuvent le citer), pour que ce serveur — le seul à connaître
 * l'invalidation — les régénère sur disque. Sinon un serveur démarré ensuite (seo:check,
 * Lighthouse) servirait encore l'ancienne version.
 */
const regenerateLists = async (request: APIRequestContext) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => new URL(match[1] ?? '/').pathname,
  );
  for (const path of paths) await request.get(path);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  for (const path of paths) await request.get(path);
};

const lexical = (text: string) => ({
  root: {
    type: 'root',
    version: 1,
    direction: 'ltr',
    format: '',
    indent: 0,
    children: [
      {
        type: 'paragraph',
        version: 1,
        direction: 'ltr',
        format: '',
        indent: 0,
        textFormat: 0,
        children: [
          { type: 'text', version: 1, text, format: 0, detail: 0, mode: 'normal', style: '' },
        ],
      },
    ],
  },
});

test('fiche sans version anglaise → page parente EN avec avis', async ({ page, request }) => {
  const jwt = await login(request);
  const stamp = Date.now().toString(36);
  const universe = await firstId(
    request,
    jwt,
    'universes?where[seo.slug][equals]=mangrove-et-iles&locale=fr&depth=0',
  );
  const destination = await firstId(request, jwt, 'destinations?limit=1&depth=0');
  const media = await firstId(request, jwt, 'media?limit=1&depth=0');
  const slug = `bascule-test-${stamp}`;
  const created = await request.post('/api/experiences?locale=fr', {
    headers: auth(jwt),
    data: {
      _status: 'published',
      title: `Bascule test ${stamp}`,
      summary: 'Expérience créée par un test automatique.',
      heroImage: media,
      gallery: [media, media, media],
      universe,
      durationMinutes: 90,
      level: 'facile',
      seasonMonths: ['11', '12'],
      meetingPoint: 'Ponton de test',
      pricePerPerson: 15000,
      destination,
      body: lexical('mangrove '.repeat(320).trim()),
      seo: {
        slug,
        metaTitle: `Bascule test ${stamp} | Saloum Évasion`,
        metaDescription: `Expérience de test ${stamp} sans version anglaise.`,
      },
    },
  });
  expect(created.status(), await created.text()).toBe(201);
  const body: unknown = await created.json();
  const id = isJson(body) && isJson(body.doc) && typeof body.doc.id === 'number' ? body.doc.id : 0;

  try {
    const frPath = `/fr/experiences/mangrove-et-iles/${slug}`;
    await expect
      .poll(async () => (await request.get(frPath)).status(), { timeout: 20_000 })
      .toBe(200);
    await page.goto(frPath);
    await page.getByRole('link', { name: 'EN, English version' }).click();
    await expect(page).toHaveURL(/\/en\/experiences$/);
    await expect(
      page.getByText('This page is not available in English yet: here is the closest page.'),
    ).toBeVisible();
  } finally {
    await request.delete(`/api/experiences/${id}`, { headers: auth(jwt) });
    await request.delete(`/api/redirects?where[from][like]=${encodeURIComponent(stamp)}`, {
      headers: auth(jwt),
    });
    await regenerateLists(request);
  }
});
