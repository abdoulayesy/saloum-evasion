import { describe, expect, it } from 'vitest';
import { buildArticle, type ArticleInput } from '@/lib/seo/jsonld/article';

// T021 (004, FR-007, contracts/jsonld.md) : Article d'un guide.

const origin = 'https://saloum-evasion.test';
const url = `${origin}/fr/carnets-du-saloum/que-faire-au-sine-saloum`;

const base: ArticleInput = {
  url,
  origin,
  locale: 'fr',
  headline: 'Que faire au Sine-Saloum',
  description: 'Dix idées pour découvrir le delta.',
  images: [`${origin}/img/hero.avif`],
  publishedOn: '2026-11-20',
  updatedOn: '2026-12-02',
  wordCount: 1234,
  author: { name: 'Aïssatou Diop', url: `${origin}/fr/equipe/aissatou-diop` },
  reviewer: null,
  destinationUrls: [`${origin}/fr/destinations/ndangane`],
};

describe('JSON-LD Article', () => {
  it('nœud complet : auteur, éditeur, dates, langue, page, lieux', () => {
    expect(buildArticle(base)).toEqual({
      '@type': 'Article',
      '@id': `${url}#article`,
      headline: 'Que faire au Sine-Saloum',
      description: 'Dix idées pour découvrir le delta.',
      image: [`${origin}/img/hero.avif`],
      inLanguage: 'fr-SN',
      datePublished: '2026-11-20',
      dateModified: '2026-12-02',
      wordCount: 1234,
      author: {
        '@type': 'Person',
        '@id': `${origin}/fr/equipe/aissatou-diop#person`,
        name: 'Aïssatou Diop',
        url: `${origin}/fr/equipe/aissatou-diop`,
      },
      publisher: { '@id': `${origin}/#org` },
      mainEntityOfPage: { '@id': `${url}#webpage` },
      about: [{ '@id': `${origin}/fr/destinations/ndangane#place` }],
    });
  });

  it('relecteur → contributor ; sans relecteur ni destination : champs absents', () => {
    const reviewed = buildArticle({
      ...base,
      reviewer: { name: 'Ibrahima Ndiaye', url: `${origin}/fr/equipe/ibrahima-ndiaye` },
    });
    expect(reviewed).toMatchObject({
      contributor: { '@id': `${origin}/fr/equipe/ibrahima-ndiaye#person` },
    });
    const bare = buildArticle({ ...base, destinationUrls: [] });
    expect(bare).not.toHaveProperty('contributor');
    expect(bare).not.toHaveProperty('about');
  });

  it('anglais : inLanguage en ; titre tronqué à 110 caractères', () => {
    const article = buildArticle({ ...base, locale: 'en', headline: 'x'.repeat(130) });
    expect(article).toMatchObject({ inLanguage: 'en' });
    expect(String(article.headline)).toHaveLength(110);
  });

  it('jamais d’avis ni de note', () => {
    const article = buildArticle(base);
    expect(article).not.toHaveProperty('review');
    expect(article).not.toHaveProperty('aggregateRating');
  });
});
