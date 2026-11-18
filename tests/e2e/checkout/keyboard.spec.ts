import { expect, test } from '@playwright/test';
import { expectFocusNotObscured } from '../support/mobile';
import { reachPaymentPage } from '../support/checkout';
import { uniqueName } from '../support/request';

// T042 (constitution IV) : étape paiement au clavier seul — choix du moyen (flèches), case des
// conditions (Espace), bouton « Payer » (Entrée) ; le focus n'est jamais masqué.

test.describe('tunnel au clavier @keyboard', () => {
  test('paiement entièrement au clavier, focus toujours visible', async ({
    page,
    request,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'Parcours clavier sur ordinateur.');
    test.setTimeout(120_000);
    await reachPaymentPage(page, request, { firstName: uniqueName('Clavier') });
    await page.getByRole('radio', { name: 'Wave' }).focus();
    await page.keyboard.press('Space');
    await expect(page.getByRole('radio', { name: 'Wave' })).toBeChecked();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('radio', { name: 'Orange Money' })).toBeChecked();
    await expectFocusNotObscured(page);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('checkbox', { name: /accepte les conditions/ })).toBeFocused();
    await page.keyboard.press('Space');
    await expectFocusNotObscured(page);
    await page.keyboard.press('Tab');
    const focusedText = await page.evaluate(() => document.activeElement?.textContent ?? '');
    expect(focusedText).toMatch(/^Payer/);
    await expectFocusNotObscured(page);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/dev\/fake-gateway\?ref=/);
  });
});
