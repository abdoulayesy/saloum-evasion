import { expect, test } from '@playwright/test';
import { observeLayoutShift, PAGE_TYPES, readLayoutShift } from './support/perf';

// T165 (perf-a11y CHK012) : CLS cumulé pendant un défilement complet de chaque type de page
// (images différées, barre collante, compteur de demande) ≤ 0,1.
test.describe('CLS pendant le défilement', () => {
  for (const { name, path } of PAGE_TYPES) {
    test(`${name} : CLS ≤ 0,1`, async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'Layout Instability API : Chromium');
      await page.goto(path, { waitUntil: 'networkidle' });
      await observeLayoutShift(page);
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y <= height; y += 400) {
        await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
        await page.waitForTimeout(120);
      }
      await page.waitForTimeout(500);
      expect(await readLayoutShift(page)).toBeLessThanOrEqual(0.1);
    });
  }
});
