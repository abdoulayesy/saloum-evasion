import { describe, expect, it } from 'vitest';
import { documentPath, parentPath } from '@/lib/redirects/paths';
import { planRedirects, resolveRedirect, type RedirectRule } from '@/lib/redirects/plan';

const table = (rules: RedirectRule[], plan: ReturnType<typeof planRedirects>) => {
  const map = new Map(rules.map((rule) => [rule.from, rule.to]));
  plan.remove.forEach((from) => map.delete(from));
  plan.upsert.forEach((rule) => map.set(rule.from, rule.to));
  return map;
};

describe('chemins des documents', () => {
  it('fiche séjour, expérience imbriquée, univers', () => {
    expect(documentPath({ collection: 'stays', locale: 'fr', slug: 'week-end' })).toBe(
      '/fr/sejours/week-end',
    );
    expect(
      documentPath({
        collection: 'experiences',
        locale: 'en',
        slug: 'pirogue',
        universeSlug: 'mangrove-and-islands',
      }),
    ).toBe('/en/experiences/mangrove-and-islands/pirogue');
    expect(documentPath({ collection: 'experiences', locale: 'fr', slug: 'x' })).toBeNull();
    expect(documentPath({ collection: 'universes', locale: 'fr', slug: 'table-du-saloum' })).toBe(
      '/fr/experiences/table-du-saloum',
    );
  });

  it('page parente la plus pertinente', () => {
    expect(parentPath('stays', 'fr')).toBe('/fr/sejours');
    expect(parentPath('accommodations', 'en')).toBe('/en/accommodation');
    expect(parentPath('experiences', 'fr', 'terre-et-villages')).toBe(
      '/fr/experiences/terre-et-villages',
    );
    expect(parentPath('experiences', 'fr')).toBe('/fr/experiences');
    expect(parentPath('universes', 'en')).toBe('/en/experiences');
  });

  // 004 (T010, FR-017, constitution III) : guides et pages d'auteur redirigés eux aussi.
  it('guide et page d’auteur, avec leur page parente', () => {
    expect(documentPath({ collection: 'guides', locale: 'fr', slug: 'mar-lodj' })).toBe(
      '/fr/carnets-du-saloum/mar-lodj',
    );
    expect(documentPath({ collection: 'teamMembers', locale: 'en', slug: 'awa-sarr' })).toBe(
      '/en/team/awa-sarr',
    );
    expect(parentPath('guides', 'en')).toBe('/en/saloum-travel-guides');
    expect(parentPath('teamMembers', 'fr')).toBe('/fr/a-propos');
  });

  it('changement de slug d’un auteur : ancienne page → nouvelle, dans chaque langue', () => {
    const added = (['fr', 'en'] as const).map((locale) => ({
      from: documentPath({ collection: 'teamMembers', locale, slug: 'awa-sar' }) ?? '',
      to: documentPath({ collection: 'teamMembers', locale, slug: 'awa-sarr' }) ?? '',
    }));
    const plan = planRedirects([], added, []);
    expect(table([], plan)).toEqual(
      new Map([
        ['/fr/equipe/awa-sar', '/fr/equipe/awa-sarr'],
        ['/en/team/awa-sar', '/en/team/awa-sarr'],
      ]),
    );
  });
});

describe('planRedirects', () => {
  it('changement de slug : ancienne adresse → nouvelle', () => {
    const plan = planRedirects([], [{ from: '/fr/sejours/a', to: '/fr/sejours/b' }]);
    expect(plan).toEqual({ upsert: [{ from: '/fr/sejours/a', to: '/fr/sejours/b' }], remove: [] });
  });

  it('dépublication avec remplacement, puis sans remplacement (liste parente)', () => {
    const withTarget = planRedirects([], [{ from: '/fr/sejours/a', to: '/fr/sejours/c' }]);
    expect(withTarget.upsert).toEqual([{ from: '/fr/sejours/a', to: '/fr/sejours/c' }]);
    const toParent = planRedirects([], [{ from: '/fr/sejours/a', to: parentPath('stays', 'fr') }]);
    expect(toParent.upsert).toEqual([{ from: '/fr/sejours/a', to: '/fr/sejours' }]);
  });

  it('aplatissement des chaînes : A → B puis B → C donne A → C et B → C', () => {
    const existing = [{ from: '/fr/sejours/a', to: '/fr/sejours/b' }];
    const plan = planRedirects(existing, [{ from: '/fr/sejours/b', to: '/fr/sejours/c' }]);
    const result = table(existing, plan);
    expect(result.get('/fr/sejours/a')).toBe('/fr/sejours/c');
    expect(result.get('/fr/sejours/b')).toBe('/fr/sejours/c');
    for (const target of result.values()) expect(result.has(target)).toBe(false);
  });

  it('retour au slug d’origine : aucune boucle', () => {
    const existing = [{ from: '/fr/sejours/a', to: '/fr/sejours/b' }];
    const plan = planRedirects(existing, [{ from: '/fr/sejours/b', to: '/fr/sejours/a' }]);
    const result = table(existing, plan);
    expect(result.has('/fr/sejours/a')).toBe(false);
    expect(result.get('/fr/sejours/b')).toBe('/fr/sejours/a');
    expect(plan.remove).toEqual(['/fr/sejours/a']);
  });

  it('cascade d’univers : chaque expérience imbriquée est redirigée', () => {
    const added = ['pirogue', 'kayak'].map((slug) => ({
      from: `/fr/experiences/mangrove/${slug}`,
      to: `/fr/experiences/mangrove-et-iles/${slug}`,
    }));
    const plan = planRedirects(
      [],
      [{ from: '/fr/experiences/mangrove', to: '/fr/experiences/mangrove-et-iles' }, ...added],
    );
    expect(plan.upsert).toHaveLength(3);
  });

  it('une adresse redevenue vivante ne redirige plus', () => {
    const existing = [{ from: '/fr/sejours/a', to: '/fr/sejours' }];
    const plan = planRedirects(existing, [], ['/fr/sejours/a']);
    expect(plan).toEqual({ upsert: [], remove: ['/fr/sejours/a'] });
  });

  it('règle identique ignorée, résolution en un saut', () => {
    expect(planRedirects([], [{ from: '/fr/x', to: '/fr/x' }])).toEqual({ upsert: [], remove: [] });
    const map = new Map([['/fr/sejours/a', '/fr/sejours/c']]);
    expect(resolveRedirect(map, '/fr/sejours/a')).toBe('/fr/sejours/c');
    expect(resolveRedirect(map, '/fr/sejours/z')).toBeNull();
  });
});
