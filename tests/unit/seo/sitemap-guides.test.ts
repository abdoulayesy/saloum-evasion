import { describe, expect, it } from 'vitest';
import { absoluteUrl } from '@/lib/site';
import { authorEntries, fixedEntries, guideEntries } from '@/lib/seo/sitemapEntries';

// T055 (004, US4, contracts/routes.md « Sitemap ») : rubrique, guides (date de dernière mise à
// jour de fond, images) et pages d'auteur, dans les seules langues publiées.

describe('sitemap des Carnets du Saloum', () => {
  it('rubrique dans les deux langues, avec hreflang', () => {
    const hub = fixedEntries().filter((entry) =>
      /\/(fr\/carnets-du-saloum|en\/saloum-travel-guides)$/.test(entry.url),
    );
    expect(hub.map((entry) => new URL(entry.url).pathname).sort()).toEqual([
      '/en/saloum-travel-guides',
      '/fr/carnets-du-saloum',
    ]);
    expect(hub[0]?.alternates?.languages).toMatchObject({
      'x-default': absoluteUrl('/fr/carnets-du-saloum'),
    });
  });

  it('guide : date de mise à jour de fond, images, une entrée par langue publiée', () => {
    const entries = guideEntries({
      slugs: { fr: 'mar-lodj-ile-sans-voitures', en: 'mar-lodj-car-free-island' },
      updatedOn: '2026-12-02',
      images: ['https://cdn.test/hero.avif', 'https://cdn.test/body.avif'],
    });
    expect(entries.map((entry) => new URL(entry.url).pathname)).toEqual([
      '/fr/carnets-du-saloum/mar-lodj-ile-sans-voitures',
      '/en/saloum-travel-guides/mar-lodj-car-free-island',
    ]);
    expect(entries[0]?.lastModified).toEqual(new Date('2026-12-02T00:00:00.000Z'));
    expect(entries[1]?.images).toEqual([
      'https://cdn.test/hero.avif',
      'https://cdn.test/body.avif',
    ]);
  });

  it('guide en français seulement : aucune entrée ni hreflang anglais', () => {
    const entries = guideEntries({ slugs: { fr: 'culture-serere' }, updatedOn: null, images: [] });
    expect(entries).toHaveLength(1);
    expect(entries[0]?.alternates?.languages).not.toHaveProperty('en');
    expect(entries[0]).not.toHaveProperty('lastModified');
  });

  it('page d’auteur : seulement dans les langues où il signe un guide publié', () => {
    expect(authorEntries('awa-sarr', ['fr']).map((entry) => new URL(entry.url).pathname)).toEqual([
      '/fr/equipe/awa-sarr',
    ]);
    expect(authorEntries('awa-sarr', ['fr', 'en'])).toHaveLength(2);
    expect(authorEntries('awa-sarr', [])).toEqual([]);
  });
});
