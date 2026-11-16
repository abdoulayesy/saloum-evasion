import { expect, test } from '@playwright/test';
import { PAGE_TYPES } from './support/perf';

// T166 (perf-a11y CHK019, CHK020) : sur chaque type de page à photo principale, l'élément LCP
// est une image AVIF ou WebP de 120 Ko au plus, avec largeur et hauteur explicites.
const PHOTO_PAGES = PAGE_TYPES.filter(({ name }) => !['FAQ', 'demande'].includes(name));

test.describe('élément LCP', () => {
  for (const { name, path } of PHOTO_PAGES) {
    test(`${name} : image AVIF/WebP ≤ 120 Ko, dimensions explicites`, async ({
      page,
      browserName,
      isMobile,
    }) => {
      test.skip(browserName !== 'chromium' || !isMobile, 'LCP mesuré en profil mobile Chromium');
      // En paysage, la photo occupe peu de hauteur : un titre peut légitimement être l'élément LCP.
      test.skip((page.viewportSize()?.height ?? 0) < 500, 'Portrait seulement');
      const images = new Map<string, { type: string; size: number }>();
      page.on('response', async (response) => {
        if (!response.url().includes('/_next/image')) return;
        const body = await response.body().catch(() => Buffer.alloc(0));
        images.set(response.url(), {
          type: response.headers()['content-type'] ?? '',
          size: body.length,
        });
      });
      await page.goto(path, { waitUntil: 'networkidle' });
      const lcp = await page.evaluate(
        () =>
          new Promise<{ tag: string; src: string; width: string; height: string }>((resolve) => {
            new PerformanceObserver((list) => {
              const last = list.getEntries().at(-1);
              const element = last ? Reflect.get(last, 'element') : null;
              resolve({
                tag: element instanceof Element ? element.tagName : '',
                src: element instanceof HTMLImageElement ? element.currentSrc : '',
                width: element instanceof Element ? (element.getAttribute('width') ?? '') : '',
                height: element instanceof Element ? (element.getAttribute('height') ?? '') : '',
              });
            }).observe({ type: 'largest-contentful-paint', buffered: true });
          }),
      );
      expect(lcp.tag, `${name} : élément LCP`).toBe('IMG');
      expect(Number(lcp.width)).toBeGreaterThan(0);
      expect(Number(lcp.height)).toBeGreaterThan(0);
      const image = images.get(lcp.src);
      expect(image, `${name} : réponse de l'image LCP`).toBeDefined();
      expect(image?.type).toMatch(/image\/(avif|webp)/);
      expect(image?.size ?? Infinity).toBeLessThanOrEqual(120 * 1024);
    });
  }
});
