import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { expectNoAxeViolations } from './support/a11y';
import { adminAuth, adminGet, adminPatch } from './support/checkout';
import { uniqueName } from './support/request';

// T041 (004, US2, FR-009, FR-011, FR-012) : encart « À lire dans les Carnets du Saloum » sur les
// fiches liées à un guide (saisie une seule fois côté guide), absent ailleurs, retiré quand le
// guide est dépublié. Mises à jour REST avec `?locale=fr` : sans langue, Payload valide les champs
// localisés comme vides (même comportement sur les collections de la 001). Données : guides de démonstration (`SEED_GUIDES_DEMO_PUBLISH=1 pnpm
// seed:guides`). Le plafond de trois guides et le retrait d'une offre dépubliée sont couverts
// par les tests unitaires (teaser.test.ts, related.test.ts).

const DEMO_TITLE = 'Guide de démonstration des Carnets du Saloum';
const teaser = (page: Page) => page.locator('section[aria-labelledby="guides-teaser"]');

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const firstId = async (request: APIRequestContext, path: string): Promise<number> => {
  const body = await adminGet(request, path);
  const doc = isRecord(body) && Array.isArray(body.docs) ? body.docs[0] : null;
  if (!isRecord(doc) || typeof doc.id !== 'number') throw new Error(`Introuvable : ${path}`);
  return doc.id;
};

test.describe('Carnets du Saloum — encart sur les fiches @guides', () => {
  test('présent sur les fiches liées : séjour, expérience, hébergement, destination', async ({
    page,
  }) => {
    for (const path of [
      '/fr/sejours/week-end-bolong-ndangane',
      '/fr/experiences/mangrove-et-iles/excursion-pirogue-bolongs',
      '/fr/hebergements/ecolodge-des-bolongs',
      '/fr/destinations/ndangane',
    ]) {
      await page.goto(path);
      const section = teaser(page);
      await expect(section, path).toBeVisible();
      await expect(section.getByRole('heading', { level: 2 })).toHaveText(
        'À lire dans les Carnets du Saloum',
      );
      await expect(section.getByRole('link', { name: DEMO_TITLE })).toBeVisible();
      expect(await section.locator('li').count()).toBeLessThanOrEqual(3);
    }
    await expectNoAxeViolations(page, 'encart des Carnets');
  });

  test('absent d’une fiche liée à aucun guide ; titre anglais', async ({ page }) => {
    await page.goto('/fr/sejours/trois-jours-iles-mangrove');
    await expect(teaser(page)).toHaveCount(0);
    await page.goto('/en/stays/bolong-weekend-ndangane');
    await expect(teaser(page).getByRole('heading', { level: 2 })).toHaveText(
      'From our Saloum Travel Guides',
    );
  });

  test('guide dépublié : l’encart de la fiche liée disparaît', async ({ page, request }) => {
    test.setTimeout(120_000);
    const name = uniqueName('Encart');
    const [heroImage, author, theme, accommodation] = await Promise.all([
      firstId(request, '/api/media?where[provenance.author][equals]=D%C3%A9monstration&limit=1'),
      firstId(request, '/api/teamMembers?where[slug][equals]=membre-demo-1&limit=1'),
      firstId(request, '/api/guideThemes?where[key][equals]=que-faire&limit=1'),
      firstId(
        request,
        '/api/accommodations?where[seo.slug][equals]=villa-piscine-ndangane&limit=1&locale=fr',
      ),
    ]);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const created = await request.post('/api/guides?locale=fr', {
      headers: await adminAuth(request),
      data: {
        _status: 'published',
        title: `Guide temporaire ${name}`,
        standfirst: 'Guide temporaire créé par un test de bout en bout, supprimé à la fin du test.',
        heroImage,
        author,
        theme,
        body: {
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
                children: [{ type: 'text', version: 1, text: 'Texte temporaire.' }],
              },
            ],
          },
        },
        relatedAccommodations: [accommodation],
        seo: {
          slug,
          metaTitle: `Temporaire ${name}`.slice(0, 60),
          metaDescription: `Guide temporaire ${name}, créé et supprimé par un test.`,
          targetKeyword: `requête temporaire ${name}`,
        },
      },
    });
    expect(created.status(), await created.text()).toBe(201);
    const createdBody: unknown = await created.json();
    const guideId =
      isRecord(createdBody) && isRecord(createdBody.doc) ? createdBody.doc.id : undefined;
    try {
      const title = `Guide temporaire ${name}`;
      await expect(async () => {
        await page.goto('/fr/hebergements/villa-piscine-ndangane');
        await expect(teaser(page).getByRole('link', { name: title })).toBeVisible();
      }).toPass({ timeout: 30_000 });
      expect(
        await adminPatch(request, `/api/guides/${String(guideId)}?locale=fr`, { _status: 'draft' }),
      ).toBe(200);
      await expect(async () => {
        await page.goto('/fr/hebergements/villa-piscine-ndangane');
        await expect(page.getByRole('link', { name: title })).toHaveCount(0);
      }).toPass({ timeout: 30_000 });
    } finally {
      await request.delete(`/api/guides/${String(guideId)}`, {
        headers: await adminAuth(request),
      });
    }
  });
});
