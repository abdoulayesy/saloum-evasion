import { expect, test } from '@playwright/test';
import { reachPaymentPage } from '../support/checkout';
import { uniqueName } from '../support/request';

// T038 (constitution VI, SC-009) : Wave, Orange Money et carte au même rang — même composant,
// boîtes de même taille (±1 px), ordre stable Wave / Orange Money / Carte, aucun présélectionné —
// à 360, 412 et 1280 px. À 360 et 412 px les trois cases sont empilées, pleine largeur ; à partir de
// 640 px elles sont sur une même ligne.

test.describe('parité des moyens de paiement @parity', () => {
  test('même rang, même surface, ordre stable, aucun présélectionné', async ({ page, request }) => {
    test.setTimeout(120_000);
    await reachPaymentPage(page, request, { firstName: uniqueName('Parite') });
    for (const width of [360, 412, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      const options = page.getByTestId('payment-methods').locator('label');
      await expect(options).toHaveCount(3);
      expect(
        await options.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-method'))),
      ).toEqual(['wave', 'orange_money', 'card']);
      const boxes = await Promise.all((await options.all()).map((option) => option.boundingBox()));
      const widths = boxes.map((box) => Math.round(box?.width ?? 0));
      const heights = boxes.map((box) => Math.round(box?.height ?? 0));
      expect(
        Math.max(...widths) - Math.min(...widths),
        `largeurs à ${width} px`,
      ).toBeLessThanOrEqual(1);
      expect(
        Math.max(...heights) - Math.min(...heights),
        `hauteurs à ${width} px`,
      ).toBeLessThanOrEqual(1);
      expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);
      if (width >= 640) {
        const tops = boxes.map((box) => Math.round(box?.y ?? 0));
        expect(new Set(tops).size, `même ligne à ${width} px`).toBe(1);
      }
      for (const radio of await page.getByRole('radio').all())
        await expect(radio).not.toBeChecked();
    }
  });
});
