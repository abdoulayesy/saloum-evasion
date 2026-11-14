import { expect, type Page } from '@playwright/test';

// À utiliser avec le projet `nojs` : le DOM est alors exactement le HTML servi (constitution III).

export type SeoSnapshot = {
  title: string;
  description: string;
  h1: string[];
  canonical: string | null;
  robots: string | null;
  hreflang: Record<string, string>;
  og: Record<string, string>;
  twitter: Record<string, string>;
  jsonLd: unknown[];
};

export const readSeo = async (page: Page): Promise<SeoSnapshot> =>
  page.evaluate(() => {
    const meta = (selector: string) =>
      document.querySelector<HTMLMetaElement>(selector)?.content ?? null;
    const collect = (prefix: string, attribute: 'property' | 'name') => {
      const entries: Record<string, string> = {};
      document
        .querySelectorAll<HTMLMetaElement>(`meta[${attribute}^="${prefix}"]`)
        .forEach((element) => {
          const key = element.getAttribute(attribute);
          if (key) entries[key] = element.content;
        });
      return entries;
    };
    const hreflang: Record<string, string> = {};
    document
      .querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]')
      .forEach((link) => {
        const lang = link.getAttribute('hreflang');
        if (lang) hreflang[lang] = link.href;
      });
    const jsonLd: unknown[] = [];
    document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
      jsonLd.push(JSON.parse(script.textContent ?? 'null'));
    });
    return {
      title: document.title,
      description: meta('meta[name="description"]') ?? '',
      h1: Array.from(document.querySelectorAll('h1')).map((heading) =>
        (heading.textContent ?? '').trim(),
      ),
      canonical: document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? null,
      robots: meta('meta[name="robots"]'),
      hreflang,
      og: collect('og:', 'property'),
      twitter: collect('twitter:', 'name'),
      jsonLd,
    };
  });

// Registre d'unicité partagé dans un même processus de test.
const seenTitles = new Map<string, string>();
const seenDescriptions = new Map<string, string>();

/** Assertions communes à toute page indexable. */
export const expectIndexableBasics = (seo: SeoSnapshot, url: string): void => {
  expect(seo.title.length, `title ≤ 60 (${seo.title})`).toBeLessThanOrEqual(60);
  expect(seo.title.length).toBeGreaterThan(0);
  expect(seo.description.length, 'description ≤ 155').toBeLessThanOrEqual(155);
  expect(seo.description.length).toBeGreaterThan(0);
  expect(seo.h1, 'un seul H1').toHaveLength(1);
  expect(seo.canonical, 'canonical').not.toBeNull();
  expect(seo.robots ?? '', 'page indexable').not.toContain('noindex');
  expect(seo.hreflang['x-default'], 'hreflang x-default').toBeDefined();
  expect(seo.hreflang.fr, 'hreflang fr').toBeDefined();
  expect(seo.og['og:image'], 'og:image').toBeDefined();
  expect(seo.twitter['twitter:card']).toBe('summary_large_image');

  const titleOwner = seenTitles.get(seo.title);
  expect(
    titleOwner === undefined || titleOwner === url,
    `title déjà utilisé par ${titleOwner}`,
  ).toBe(true);
  seenTitles.set(seo.title, url);
  const descriptionOwner = seenDescriptions.get(seo.description);
  expect(
    descriptionOwner === undefined || descriptionOwner === url,
    `description déjà utilisée par ${descriptionOwner}`,
  ).toBe(true);
  seenDescriptions.set(seo.description, url);
};

/** Types schema.org présents dans le JSON-LD (y compris dans un @graph). */
export const jsonLdTypes = (seo: SeoSnapshot): string[] => {
  const types: string[] = [];
  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (node === null || typeof node !== 'object') return;
    const record: Record<string, unknown> = Object.fromEntries(Object.entries(node));
    const type = record['@type'];
    if (typeof type === 'string') types.push(type);
    if (Array.isArray(type))
      type.forEach((value) => typeof value === 'string' && types.push(value));
    if (record['@graph']) visit(record['@graph']);
  };
  seo.jsonLd.forEach(visit);
  return types;
};
