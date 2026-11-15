import { expect, test } from '@playwright/test';
import { expectIndexableBasics, jsonLdTypes, readSeo } from './support/seo';

// T130 (projet nojs) : page film — métadonnées, VideoObject + Clip, liens de chapitre et
// balises vidéo du sitemap, sur le HTML servi.
const FR = '/fr/film-immersion';
const EN = '/en/immersion-film';

const findVideo = (jsonLd: unknown[]): Record<string, unknown> | null => {
  let found: Record<string, unknown> | null = null;
  const visit = (node: unknown): void => {
    if (found || node === null || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    const record: Record<string, unknown> = Object.fromEntries(Object.entries(node));
    if (record['@type'] === 'VideoObject') {
      found = record;
      return;
    }
    Object.values(record).forEach(visit);
  };
  visit(jsonLd);
  return found;
};

test.describe('film — SEO', () => {
  test('métadonnées, hreflang, image de partage = affiche', async ({ page }) => {
    await page.goto(FR);
    const fr = await readSeo(page);
    expectIndexableBasics(fr, FR);
    expect(fr.hreflang.en).toMatch(new RegExp(`${EN}$`));
    expect(fr.og['og:image']).toContain('/api/media/file/');
    await page.goto(EN);
    expectIndexableBasics(await readSeo(page), EN);
  });

  test('VideoObject : MP4 en contentUrl, durée ISO, Clip par chapitre', async ({ page }) => {
    await page.goto(FR);
    const seo = await readSeo(page);
    expect(jsonLdTypes(seo)).toEqual(
      expect.arrayContaining(['VideoObject', 'BreadcrumbList', 'TravelAgency']),
    );
    const video = findVideo(seo.jsonLd);
    expect(video).not.toBeNull();
    expect(video?.contentUrl).toMatch(/^https:\/\/stream\.mux\.com\/[A-Za-z0-9]+\/highest\.mp4$/);
    expect(video?.duration).toBe('PT4M10S');
    expect(video?.thumbnailUrl).toEqual([expect.stringMatching(/^https:\/\/image\.mux\.com\//)]);
    expect(JSON.stringify(seo.jsonLd)).not.toContain('.m3u8');
    const clips = Array.isArray(video?.hasPart) ? video.hasPart : [];
    expect(clips).toHaveLength(4);
    expect(clips[1]).toMatchObject({ startOffset: 62, endOffset: 125 });
    expect(clips[3]).toMatchObject({ startOffset: 190, endOffset: 250 });
  });

  test('chapitres visibles : liens ?t= identiques aux Clip ; transcription', async ({ page }) => {
    await page.goto(FR);
    const links = page.getByRole('navigation', { name: 'Chapitres du film' }).getByRole('link');
    await expect(links).toHaveCount(4);
    await expect(links.nth(1)).toHaveAttribute('href', `${FR}?t=62`);
    await expect(page.getByRole('heading', { name: 'Transcription descriptive' })).toBeVisible();
    // Sans JavaScript : affiche et bouton, aucun lecteur ni flux.
    await expect(page.locator('video')).toHaveCount(0);
  });

  test('sitemap : balises vidéo de la page film', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    expect(xml).toContain('xmlns:video=');
    const entry = xml.split('<url>').find((block) => block.includes(`${FR}</loc>`)) ?? '';
    expect(entry).toContain('<video:video>');
    expect(entry).toMatch(/<video:thumbnail_loc>https:\/\/image\.mux\.com\//);
    expect(entry).toMatch(/<video:content_loc>https:\/\/stream\.mux\.com\/[^<]+\.mp4/);
    expect(entry).toContain('<video:duration>250</video:duration>');
  });
});
