import { expect, test } from '@playwright/test';
import { PAGE_TYPES } from './support/perf';

// T163 (perf-a11y CHK023, CHK029) : aucun script tiers dans le HTML initial ; aucun appel tiers
// au chargement (la mesure Plausible n'arrive qu'après inactivité, et seulement si un domaine
// est configuré) ; aucune police servie par un domaine externe ; 2 familles de polices au plus.
test.describe('ressources tierces et polices', () => {
  test('HTML initial sans script tiers, sur chaque type de page', async ({ request }) => {
    for (const { path } of PAGE_TYPES) {
      const html = await (await request.get(path)).text();
      const external = [...html.matchAll(/<script[^>]+src="(https?:\/\/[^"]+)"/g)].map(
        (match) => match[1],
      );
      expect(external, `${path} : scripts tiers`).toEqual([]);
    }
  });

  test('au chargement : aucune requête tierce, polices locales, 2 familles au plus', async ({
    page,
    baseURL,
  }) => {
    const origin = new URL(baseURL ?? 'http://localhost:3000').origin;
    const thirdParty: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.origin !== origin && url.protocol.startsWith('http')) thirdParty.push(request.url());
    });
    await page.goto('/fr/sejours/week-end-bolong-ndangane', { waitUntil: 'load' });
    // Fenêtre courte après `load` : avant toute inactivité, rien ne doit partir vers un tiers.
    await page.waitForTimeout(300);
    expect(thirdParty).toEqual([]);
    const families = await page.evaluate(async () => {
      await document.fonts.ready;
      // Les familles « … Fallback » ne sont que des métriques de repli posées sur des polices
      // système (aucun téléchargement) : seules les familles téléchargées comptent.
      return [
        ...new Set(
          [...document.fonts]
            .map((face) => face.family.replaceAll('"', ''))
            .filter((family) => !family.endsWith('Fallback')),
        ),
      ];
    });
    expect(families.length).toBeGreaterThan(0);
    expect(families.length, families.join(', ')).toBeLessThanOrEqual(2);
  });
});
