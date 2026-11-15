import { expect, test, type APIRequestContext } from '@playwright/test';

// T072 (projet desktop, dérogation D-T6b) : l'équipe publie de façon sûre.
// - publication refusée sans texte alternatif anglais, ou sous 300 mots ;
// - changement de slug d'un contenu publié → 301 ancienne → nouvelle adresse ;
// - dépublication → 301 vers la liste parente, retirée à la republication ;
// - la table des redirections est à jour immédiatement (revalidation par tag).
// Nécessite la base migrée et le seed ; chaque test remet les données en l'état.

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@saloum-evasion.test';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'demo-admin-password';

test.describe.configure({ mode: 'serial' });

type Json = Record<string, unknown>;

const isJson = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const token = async (request: APIRequestContext): Promise<string> => {
  const response = await request.post('/api/users/login', {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(response.status()).toBe(200);
  const body: unknown = await response.json();
  return isJson(body) && typeof body.token === 'string' ? body.token : '';
};

const auth = (jwt: string) => ({ Authorization: `JWT ${jwt}` });

const findBySlug = async (
  request: APIRequestContext,
  jwt: string,
  collection: string,
  slug: string,
): Promise<Json> => {
  const response = await request.get(
    `/api/${collection}?locale=fr&depth=0&where[seo.slug][equals]=${slug}`,
    { headers: auth(jwt) },
  );
  const body: unknown = await response.json();
  const docs = isJson(body) && Array.isArray(body.docs) ? body.docs : [];
  const [doc] = docs;
  expect(isJson(doc), `${collection} « ${slug} » introuvable (seed ?)`).toBe(true);
  return isJson(doc) ? doc : {};
};

const redirectTable = async (request: APIRequestContext): Promise<Record<string, string>> => {
  const body: unknown = await (await request.get('/api/redirect-table')).json();
  if (!isJson(body)) return {};
  return Object.fromEntries(
    Object.entries(body).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  );
};

const expect301 = async (request: APIRequestContext, from: string, to: string) => {
  const response = await request.get(from, { maxRedirects: 0 });
  expect(response.status(), from).toBe(301);
  expect(new URL(response.headers().location ?? '', 'http://x').pathname).toBe(to);
};

const setSlug = async (
  request: APIRequestContext,
  jwt: string,
  collection: string,
  doc: Json,
  slug: string,
) => {
  const seo = isJson(doc.seo) ? doc.seo : {};
  const response = await request.patch(`/api/${collection}/${String(doc.id)}?locale=fr`, {
    headers: auth(jwt),
    data: { _status: 'published', seo: { ...seo, slug } },
  });
  expect(response.status(), await response.text()).toBe(200);
};

const deleteRedirect = async (request: APIRequestContext, jwt: string, from: string) => {
  await request.delete(`/api/redirects?where[from][equals]=${encodeURIComponent(from)}`, {
    headers: auth(jwt),
  });
};

test.describe('US3 — l’équipe gère le catalogue', () => {
  test('photo sans texte alternatif anglais refusée', async ({ request }) => {
    const jwt = await token(request);
    const response = await request.post('/api/media', {
      headers: auth(jwt),
      multipart: {
        file: { name: 'test.png', mimeType: 'image/png', buffer: Buffer.from('placeholder') },
        _payload: JSON.stringify({
          alt: { fr: 'Pirogue sur le bolong' },
          provenance: { author: 'Test', place: 'Ndangane', date: '2026-11-01' },
        }),
      },
    });
    expect(response.status()).toBe(400);
  });

  test('publication refusée sous 300 mots', async ({ request }) => {
    const jwt = await token(request);
    const response = await request.post('/api/stays?locale=fr', {
      headers: auth(jwt),
      data: {
        _status: 'published',
        title: 'Séjour trop court',
        body: {
          root: {
            type: 'root',
            version: 1,
            children: [
              {
                type: 'paragraph',
                version: 1,
                children: [{ type: 'text', version: 1, text: 'Quelques mots seulement.' }],
              },
            ],
          },
        },
      },
    });
    expect(response.status()).toBe(400);
    expect(await response.text()).toMatch(/300 au minimum/);
  });

  test('slug modifié : 301 de l’ancienne vers la nouvelle adresse, sans boucle au retour', async ({
    request,
  }) => {
    const jwt = await token(request);
    const oldPath = '/fr/experiences/terre-et-villages/quad-sine-saloum';
    const newPath = '/fr/experiences/terre-et-villages/quad-test-redirection';
    const experience = await findBySlug(request, jwt, 'experiences', 'quad-sine-saloum');

    await setSlug(request, jwt, 'experiences', experience, 'quad-test-redirection');
    expect((await redirectTable(request))[oldPath]).toBe(newPath);
    await expect301(request, oldPath, newPath);

    const renamed = await findBySlug(request, jwt, 'experiences', 'quad-test-redirection');
    await setSlug(request, jwt, 'experiences', renamed, 'quad-sine-saloum');
    const table = await redirectTable(request);
    expect(table[oldPath], 'l’adresse d’origine est de nouveau vivante').toBeUndefined();
    expect(table[newPath]).toBe(oldPath);

    await deleteRedirect(request, jwt, newPath);
    expect((await redirectTable(request))[newPath]).toBeUndefined();
  });

  test('dépublication : 301 vers la liste parente, retirée à la republication', async ({
    request,
  }) => {
    const jwt = await token(request);
    const frPath = '/fr/hebergements/campement-de-palmarin';
    const enPath = '/en/accommodation/palmarin-camp';
    const accommodation = await findBySlug(request, jwt, 'accommodations', 'campement-de-palmarin');
    const id = String(accommodation.id);

    const unpublish = await request.patch(`/api/accommodations/${id}?locale=fr`, {
      headers: auth(jwt),
      data: { _status: 'draft' },
    });
    expect(unpublish.status(), await unpublish.text()).toBe(200);
    const table = await redirectTable(request);
    expect(table[frPath]).toBe('/fr/hebergements');
    expect(table[enPath]).toBe('/en/accommodation');
    await expect301(request, frPath, '/fr/hebergements');

    const republish = await request.patch(`/api/accommodations/${id}?locale=fr`, {
      headers: auth(jwt),
      data: { _status: 'published' },
    });
    expect(republish.status(), await republish.text()).toBe(200);
    const after = await redirectTable(request);
    expect(after[frPath]).toBeUndefined();
    expect(after[enPath]).toBeUndefined();
  });

  test('un brouillon ne crée aucune redirection', async ({ request }) => {
    const jwt = await token(request);
    const stay = await findBySlug(request, jwt, 'stays', 'week-end-bolong-ndangane');
    const seo = isJson(stay.seo) ? stay.seo : {};
    const draft = await request.patch(`/api/stays/${String(stay.id)}?locale=fr&draft=true`, {
      headers: auth(jwt),
      data: { seo: { ...seo, slug: 'brouillon-sans-redirection' } },
    });
    expect(draft.status(), await draft.text()).toBe(200);
    expect((await redirectTable(request))['/fr/sejours/week-end-bolong-ndangane']).toBeUndefined();
    // Le brouillon est abandonné : on republie la version publique d'origine.
    const restore = await request.patch(`/api/stays/${String(stay.id)}?locale=fr`, {
      headers: auth(jwt),
      data: { _status: 'published', seo: { ...seo, slug: 'week-end-bolong-ndangane' } },
    });
    expect(restore.status(), await restore.text()).toBe(200);
  });
});
