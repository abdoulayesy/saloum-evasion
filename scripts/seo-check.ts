// Contrôle SEO du site construit (constitution III) :
// liens cassés, unicité et longueurs des title/description, réciprocité hreflang,
// chaînes de redirection d'au plus 1 saut.
// Exécution : BASE_URL=http://localhost:3000 node --experimental-strip-types scripts/seo-check.ts
// (serveur de production démarré). Complété en phase 10 (couverture des mots-clés).
import { LinkChecker } from 'linkinator';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

type PageSeo = { url: string; title: string; description: string; hreflang: Map<string, string> };

const firstMatch = (html: string, pattern: RegExp): string => pattern.exec(html)?.[1]?.trim() ?? '';

const decode = (value: string): string =>
  value
    .replaceAll('&amp;', '&')
    .replaceAll('&#x27;', "'")
    .replaceAll('&#39;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');

const readSitemapUrls = async (): Promise<string[]> => {
  const response = await fetch(`${BASE_URL}/sitemap.xml`);
  if (!response.ok) return [`${BASE_URL}/fr`];
  const xml = await response.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1] ?? '').filter(Boolean);
};

const readPage = async (url: string): Promise<PageSeo> => {
  const html = await (await fetch(url)).text();
  const hreflang = new Map<string, string>();
  for (const match of html.matchAll(/<link[^>]+rel="alternate"[^>]*>/g)) {
    const tag = match[0];
    const lang = firstMatch(tag, /hrefLang="([^"]+)"/i) || firstMatch(tag, /hreflang="([^"]+)"/i);
    const href = firstMatch(tag, /href="([^"]+)"/);
    if (lang && href) hreflang.set(lang, decode(href));
  }
  return {
    url,
    title: decode(firstMatch(html, /<title>([^<]*)<\/title>/)),
    description: decode(firstMatch(html, /<meta name="description" content="([^"]*)"/)),
    hreflang,
  };
};

const checkRedirectChain = async (url: string): Promise<number> => {
  let hops = 0;
  let current = url;
  while (hops < 5) {
    const response = await fetch(current, { redirect: 'manual' });
    const location = response.headers.get('location');
    if (response.status < 300 || response.status >= 400 || !location) return hops;
    current = new URL(location, current).toString();
    hops += 1;
  }
  return hops;
};

const main = async (): Promise<void> => {
  const errors: string[] = [];
  const urls = await readSitemapUrls();
  const pages = await Promise.all(urls.map(readPage));

  const titles = new Map<string, string>();
  const descriptions = new Map<string, string>();
  for (const page of pages) {
    if (page.title.length === 0 || page.title.length > 60)
      errors.push(`${page.url} : title de ${page.title.length} caractères`);
    if (page.description.length === 0 || page.description.length > 155)
      errors.push(`${page.url} : description de ${page.description.length} caractères`);
    const titleOwner = titles.get(page.title);
    if (titleOwner) errors.push(`${page.url} : title identique à ${titleOwner}`);
    titles.set(page.title, page.url);
    const descriptionOwner = descriptions.get(page.description);
    if (descriptionOwner) errors.push(`${page.url} : description identique à ${descriptionOwner}`);
    descriptions.set(page.description, page.url);
  }

  const byUrl = new Map(pages.map((page) => [page.url, page]));
  for (const page of pages) {
    if (page.hreflang.size === 0) continue;
    if (!page.hreflang.has('x-default')) errors.push(`${page.url} : hreflang x-default manquant`);
    for (const [lang, target] of page.hreflang) {
      if (lang === 'x-default') continue;
      const alternate = byUrl.get(target);
      if (!alternate) continue;
      const back = [...alternate.hreflang.values()].includes(page.url);
      if (!back) errors.push(`${page.url} → ${target} (${lang}) : hreflang non réciproque`);
    }
  }

  const rootHops = await checkRedirectChain(`${BASE_URL}/`);
  if (rootHops > 1) errors.push(`/ : ${rootHops} redirections enchaînées (max 1)`);

  const checker = new LinkChecker();
  const result = await checker.check({
    path: urls[0] ?? `${BASE_URL}/fr`,
    recurse: true,
    linksToSkip: ['^(?!' + BASE_URL + ')'],
  });
  for (const link of result.links) {
    if (link.state === 'BROKEN')
      errors.push(`Lien cassé : ${link.url} (depuis ${link.parent ?? '?'}, ${link.status ?? '?'})`);
  }

  console.log(
    `${pages.length} pages du sitemap contrôlées, ${result.links.length} liens vérifiés.`,
  );
  if (errors.length > 0) {
    console.error('\nProblèmes SEO :');
    errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }
  console.log('Aucun problème SEO détecté.');
};

await main();
