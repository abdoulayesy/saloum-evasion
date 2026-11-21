import { expect, test, type APIRequestContext } from '@playwright/test';
import { uniqueName } from './support/request';

// T048 (004, US3, FR-014 à FR-019, FR-015b) : publication d'un guide dans l'admin — refus tant
// qu'un élément obligatoire manque (liste des manques), « Mise à jour importante » remise à zéro,
// 301 au changement de slug d'un guide et d'un auteur, encadré « Points à vérifier » sans
// blocage, bouton « Aperçu ». Projet desktop-admin (dérogation D-T6b). Mises à jour REST avec
// `?locale=fr` (sans langue, Payload valide les champs localisés comme vides).

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@saloum-evasion.test';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'demo-admin-password';

type Json = Record<string, unknown>;

const isJson = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const login = async (request: APIRequestContext): Promise<Record<string, string>> => {
  const response = await request.post('/api/users/login', {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const body: unknown = await response.json();
  return { Authorization: `JWT ${isJson(body) ? String(body.token) : ''}` };
};

const firstId = async (
  request: APIRequestContext,
  headers: Record<string, string>,
  path: string,
) => {
  const body: unknown = await (await request.get(path, { headers })).json();
  const doc = isJson(body) && Array.isArray(body.docs) ? body.docs[0] : null;
  if (!isJson(doc) || typeof doc.id !== 'number') throw new Error(`Introuvable : ${path}`);
  return doc.id;
};

const paragraph = (text: string) => ({
  root: {
    type: 'root',
    version: 1,
    format: '',
    indent: 0,
    direction: 'ltr',
    children: [
      {
        type: 'paragraph',
        version: 1,
        format: '',
        indent: 0,
        direction: 'ltr',
        children: [{ type: 'text', version: 1, text }],
      },
    ],
  },
});

const expect301 = async (request: APIRequestContext, from: string, to: string) => {
  const response = await request.get(from, { maxRedirects: 0 });
  expect(response.status(), from).toBe(301);
  expect(new URL(response.headers().location ?? '', 'http://x').pathname).toBe(to);
};

/** Données communes d'un guide de test (image, thème, offre liée). */
const fixtures = async (request: APIRequestContext, headers: Record<string, string>) => {
  const [heroImage, theme, destination] = await Promise.all([
    firstId(
      request,
      headers,
      '/api/media?where[provenance.author][equals]=D%C3%A9monstration&limit=1',
    ),
    firstId(request, headers, '/api/guideThemes?where[key][equals]=preparer&limit=1'),
    firstId(
      request,
      headers,
      '/api/destinations?where[seo.slug][equals]=ndangane&limit=1&locale=fr',
    ),
  ]);
  return { heroImage, theme, destination };
};

const today = () => new Date().toISOString().slice(0, 10);

test.describe('Carnets du Saloum — publication dans l’admin @guides', () => {
  test('refus tant qu’il manque un élément obligatoire ; « Mise à jour importante » remise à zéro', async ({
    request,
  }) => {
    const headers = await login(request);
    const { heroImage, theme, destination } = await fixtures(request, headers);
    const author = await firstId(
      request,
      headers,
      '/api/teamMembers?where[slug][equals]=membre-demo-1&limit=1',
    );
    const name = uniqueName('Garde');
    const draft = await request.post('/api/guides?locale=fr&draft=true', {
      headers,
      data: {
        _status: 'draft',
        title: `Guide ${name}`,
        standfirst: 'Chapeau du guide de test.',
        theme,
        body: paragraph('Texte du guide de test.'),
        seo: {
          slug: name.toLowerCase(),
          metaTitle: `Guide ${name}`,
          metaDescription: `Description ${name}.`,
        },
      },
    });
    expect(draft.status(), await draft.text()).toBe(201);
    const draftBody: unknown = await draft.json();
    const id = isJson(draftBody) && isJson(draftBody.doc) ? draftBody.doc.id : null;
    try {
      const refused = await request.patch(`/api/guides/${String(id)}?locale=fr`, {
        headers,
        data: { _status: 'published' },
      });
      expect(refused.status()).toBe(400);
      const message = await refused.text();
      for (const missing of [
        'Auteur obligatoire',
        'Image principale manquante',
        'Requête cible (SEO) manquante',
      ])
        expect(message).toContain(missing);

      const published = await request.patch(`/api/guides/${String(id)}?locale=fr`, {
        headers,
        data: {
          _status: 'published',
          author,
          heroImage,
          relatedDestinations: [destination],
          seo: {
            slug: name.toLowerCase(),
            metaTitle: `Guide ${name}`,
            metaDescription: `Description ${name}.`,
            targetKeyword: `requête ${name}`,
          },
        },
      });
      expect(published.status(), await published.text()).toBe(200);
      const first: unknown = await published.json();
      const firstDoc = isJson(first) && isJson(first.doc) ? first.doc : {};
      expect(firstDoc.publishedOn).toBe(today());
      expect(firstDoc.updatedOn).toBe(today());

      const updated = await request.patch(`/api/guides/${String(id)}?locale=fr`, {
        headers,
        data: { _status: 'published', substantiveUpdate: true },
      });
      const second: unknown = await updated.json();
      const secondDoc = isJson(second) && isJson(second.doc) ? second.doc : {};
      expect(secondDoc.substantiveUpdate).toBe(false);
      expect(secondDoc.updatedOn).toBe(today());
    } finally {
      await request.delete(`/api/guides/${String(id)}`, { headers });
    }
  });

  test('301 au changement de slug d’un guide et d’un auteur (FR et EN)', async ({ request }) => {
    const headers = await login(request);
    const { heroImage, theme, destination } = await fixtures(request, headers);
    const photo = heroImage;
    const name = uniqueName('Slug').toLowerCase();
    const member = await request.post('/api/teamMembers?locale=fr', {
      headers,
      data: {
        name: `Auteur ${name}`,
        role: 'Guide',
        photo,
        slug: `auteur-${name}`,
        bio: 'Présentation.',
        place: 'Ndangane',
      },
    });
    expect(member.status(), await member.text()).toBe(201);
    const memberBody: unknown = await member.json();
    const memberId = isJson(memberBody) && isJson(memberBody.doc) ? memberBody.doc.id : null;
    let guideId: unknown = null;
    try {
      const guide = await request.post('/api/guides?locale=fr', {
        headers,
        data: {
          _status: 'published',
          title: `Guide ${name}`,
          standfirst: 'Chapeau du guide de test.',
          heroImage,
          theme,
          author: memberId,
          body: paragraph('Texte du guide de test.'),
          relatedDestinations: [destination],
          seo: {
            slug: `guide-${name}`,
            metaTitle: `Guide ${name}`,
            metaDescription: `Description ${name}.`,
            targetKeyword: `requête ${name}`,
          },
        },
      });
      expect(guide.status(), await guide.text()).toBe(201);
      const guideBody: unknown = await guide.json();
      guideId = isJson(guideBody) && isJson(guideBody.doc) ? guideBody.doc.id : null;

      const renamed = await request.patch(`/api/guides/${String(guideId)}?locale=fr`, {
        headers,
        data: {
          _status: 'published',
          seo: {
            slug: `guide-${name}-2`,
            metaTitle: `Guide ${name}`,
            metaDescription: `Description ${name}.`,
            targetKeyword: `requête ${name}`,
          },
        },
      });
      expect(renamed.status(), await renamed.text()).toBe(200);
      await expect301(
        request,
        `/fr/carnets-du-saloum/guide-${name}`,
        `/fr/carnets-du-saloum/guide-${name}-2`,
      );

      const author = await request.patch(`/api/teamMembers/${String(memberId)}?locale=fr`, {
        headers,
        data: { slug: `auteur-${name}-2` },
      });
      expect(author.status(), await author.text()).toBe(200);
      await expect301(request, `/fr/equipe/auteur-${name}`, `/fr/equipe/auteur-${name}-2`);
      await expect301(request, `/en/team/auteur-${name}`, `/en/team/auteur-${name}-2`);
    } finally {
      if (guideId !== null) await request.delete(`/api/guides/${String(guideId)}`, { headers });
      await request.delete(`/api/teamMembers/${String(memberId)}`, { headers });
    }
  });

  test('formulaire : « Points à vérifier » sans blocage et bouton « Aperçu »', async ({
    page,
    request,
  }) => {
    const headers = await login(request);
    const id = await firstId(
      request,
      headers,
      '/api/guides?where[seo.slug][equals]=guide-de-demonstration-francais&locale=fr&limit=1',
    );
    await page.goto('/admin/login');
    await page.locator('input[name="email"]').fill(ADMIN_EMAIL);
    await page.locator('input[name="password"]').fill(ADMIN_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/admin\/?$/);
    await page.goto(`/admin/collections/guides/${id}`);
    const warnings = page.locator('[data-guide-warnings]');
    await expect(warnings).toBeVisible({ timeout: 30_000 });
    await expect(warnings).toContainText('la publication reste possible');
    await expect(warnings).toContainText('mots');
    const preview = page.getByRole('link', { name: /Aperçu|Preview/ }).first();
    await expect(preview).toHaveAttribute(
      'href',
      /\/fr\/carnets-du-saloum\/guide-de-demonstration-francais$/,
    );
  });
});
