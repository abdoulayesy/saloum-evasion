import { expect, test } from '@playwright/test';

// T159 (projet nojs) : hreflang réciproques sur toutes les URL du sitemap, `x-default` = FR.
type Alternates = Record<string, string>;

const alternatesOf = (html: string): Alternates => {
  const result: Alternates = {};
  for (const match of html.matchAll(/<link[^>]+rel="alternate"[^>]*>/g)) {
    const tag = match[0];
    const lang = /hrefLang="([^"]+)"/i.exec(tag)?.[1];
    const href = /href="([^"]+)"/.exec(tag)?.[1];
    if (lang && href) result[lang] = new URL(href).pathname;
  }
  return result;
};

test('hreflang réciproques et x-default = FR pour toutes les URL du sitemap', async ({
  request,
}) => {
  test.setTimeout(120_000);
  const xml = await (await request.get('/sitemap.xml')).text();
  const paths = [
    ...new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1] ?? '').pathname)),
  ];
  expect(paths.length).toBeGreaterThan(20);
  const cache = new Map<string, Alternates>();
  const read = async (path: string): Promise<Alternates> => {
    const known = cache.get(path);
    if (known) return known;
    const value = alternatesOf(await (await request.get(path)).text());
    cache.set(path, value);
    return value;
  };
  for (const path of paths) {
    const own = await read(path);
    const locale = path.split('/')[1] ?? '';
    expect(own[locale], `${path} : hreflang vers elle-même`).toBe(path);
    expect(own['x-default'], `${path} : x-default`).toBe(own.fr);
    for (const [lang, target] of Object.entries(own)) {
      if (lang === 'x-default' || target === path) continue;
      const back = await read(target);
      expect(back[locale], `${target} doit renvoyer vers ${path}`).toBe(path);
    }
  }
});
