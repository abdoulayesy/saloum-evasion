import { expect, test } from '@playwright/test';

// T154 (US4) : chaque route publique du sitemap contient un lien wa.me ; sur les fiches, le
// message pré-rédigé mentionne le titre de la page, dans sa langue. Vérifié sur le HTML servi
// (sans navigateur), une seule fois.
const decode = (href: string): string => decodeURIComponent(href.split('?text=')[1] ?? '');

test.describe('US4 — WhatsApp sur chaque page publique', () => {
  test('lien wa.me sur toutes les routes du sitemap, titre dans le message des fiches', async ({
    request,
    browserName,
    isMobile,
  }, testInfo) => {
    test.skip(
      browserName !== 'chromium' || !isMobile || testInfo.project.name !== 'android-360',
      'Contrôle du HTML servi : une seule exécution',
    );
    test.setTimeout(120_000);
    const xml = await (await request.get('/sitemap.xml')).text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1] ?? '');
    expect(urls.length).toBeGreaterThan(20);
    for (const url of urls) {
      const path = new URL(url).pathname;
      const html = await (await request.get(path)).text();
      const links = [...html.matchAll(/href="(https:\/\/wa\.me\/[^"]+)"/g)].map((match) =>
        (match[1] ?? '').replaceAll('&amp;', '&'),
      );
      expect(links.length, `${path} : lien WhatsApp`).toBeGreaterThan(0);
      const title = /<h1[^>]*>([^<]+)<\/h1>/.exec(html)?.[1]?.trim();
      const isDetail =
        /\/(sejours|stays|hebergements|accommodation|destinations)\/[^/]+$|\/experiences\/[^/]+\/[^/]+$/.test(
          path,
        );
      if (isDetail && title) {
        expect(
          links.some((href) =>
            decode(href).includes(title.replaceAll('&#x27;', '’').replaceAll('&amp;', '&')),
          ),
          `${path} : message avec « ${title} »`,
        ).toBe(true);
        const english = path.startsWith('/en/');
        expect(
          links.some((href) => (english ? /^Hello/ : /^Bonjour/).test(decode(href))),
          `${path} : message dans la langue de la page`,
        ).toBe(true);
      }
    }
  });
});
