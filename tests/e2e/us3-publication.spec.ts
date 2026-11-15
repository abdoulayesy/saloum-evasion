import { expect, test, type APIRequestContext } from '@playwright/test';

// T111 (projet desktop) : une expérience bilingue publiée depuis le CMS apparaît en FR et EN,
// dans son univers et dans le sitemap ; une version anglaise incomplète n'est ni servie ni
// annoncée en hreflang. Les contenus créés sont supprimés à la fin (avec leurs redirections).

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@saloum-evasion.test';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'demo-admin-password';

test.describe.configure({ mode: 'serial' });

type Json = Record<string, unknown>;
const isJson = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Balise hreflang anglaise (et non le lien « EN » de l'en-tête). */
const ALTERNATE_EN = /<link[^>]+rel="alternate"[^>]+hrefLang="en"/i;

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

const words = (lang: string) => `${lang} `.repeat(320).trim();

/** La page publique finit par refléter la publication (régénération à la demande). */
const eventually = async (check: () => Promise<boolean>, label: string) => {
  await expect
    .poll(check, { message: label, timeout: 20_000, intervals: [500, 1000, 2000] })
    .toBe(true);
};

test('publication bilingue : fiche FR et EN, univers, sitemap ; EN incomplète non servie', async ({
  request,
}) => {
  const jwt = await token(request);
  const stamp = Date.now().toString(36);
  const universe = await firstId(
    request,
    jwt,
    'universes?where[seo.slug][equals]=mangrove-et-iles&locale=fr&depth=0',
  );
  const destination = await firstId(request, jwt, 'destinations?limit=1&depth=0');
  const media = await firstId(request, jwt, 'media?limit=1&depth=0');
  expect(universe * destination * media, 'données du seed').toBeGreaterThan(0);

  const frSlug = `kayak-test-${stamp}`;
  const enSlug = `kayak-trip-${stamp}`;
  const created = await request.post('/api/experiences?locale=fr', {
    headers: auth(jwt),
    data: {
      _status: 'published',
      title: `Kayak test ${stamp}`,
      summary: 'Expérience créée par un test automatique.',
      heroImage: media,
      gallery: [media, media, media],
      universe,
      durationMinutes: 120,
      level: 'facile',
      seasonMonths: ['11', '12', '1', '2'],
      meetingPoint: 'Ponton de test',
      pricePerPerson: 20000,
      destination,
      body: lexical(words('mangrove')),
      seo: {
        slug: frSlug,
        metaTitle: `Kayak test ${stamp} | Saloum Évasion`,
        metaDescription: `Expérience de test ${stamp} créée et supprimée automatiquement.`,
      },
    },
  });
  expect(created.status(), await created.text()).toBe(201);
  const createdBody: unknown = await created.json();
  const doc = isJson(createdBody) && isJson(createdBody.doc) ? createdBody.doc : {};
  const id = typeof doc.id === 'number' ? doc.id : 0;

  try {
    const frPath = `/fr/experiences/mangrove-et-iles/${frSlug}`;
    const enPath = `/en/experiences/mangrove-and-islands/${enSlug}`;

    // Version anglaise encore absente : seule la FR est servie, sans hreflang EN.
    await eventually(async () => (await request.get(frPath)).status() === 200, 'fiche FR en ligne');
    const frHtml = await (await request.get(frPath)).text();
    expect(frHtml).not.toMatch(ALTERNATE_EN);
    expect((await request.get(enPath)).status()).toBe(404);

    // Version anglaise complétée et publiée.
    const english = await request.patch(`/api/experiences/${id}?locale=en`, {
      headers: auth(jwt),
      data: {
        _status: 'published',
        title: `Kayak trip ${stamp}`,
        summary: 'Experience created by an automated test.',
        meetingPoint: 'Test pontoon',
        body: lexical(words('mangrove')),
        seo: {
          slug: enSlug,
          metaTitle: `Kayak trip ${stamp} | Saloum Évasion`,
          metaDescription: `Test experience ${stamp} created and removed automatically.`,
        },
      },
    });
    expect(english.status(), await english.text()).toBe(200);

    await eventually(async () => (await request.get(enPath)).status() === 200, 'fiche EN en ligne');
    await eventually(
      async () => ALTERNATE_EN.test(await (await request.get(frPath)).text()),
      'hreflang EN annoncé sur la fiche FR',
    );
    await eventually(
      async () =>
        (await (await request.get('/fr/experiences/mangrove-et-iles')).text()).includes(frSlug),
      'fiche listée dans son univers',
    );
    await eventually(
      async () => (await (await request.get('/sitemap.xml')).text()).includes(frPath),
      'fiche présente dans le sitemap',
    );
  } finally {
    await request.delete(`/api/experiences/${id}`, { headers: auth(jwt) });
    await request.delete(`/api/redirects?where[from][like]=${encodeURIComponent(stamp)}`, {
      headers: auth(jwt),
    });
  }
});

const token = login;
