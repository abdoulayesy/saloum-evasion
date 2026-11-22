import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from '../support/a11y';
import { expectNoHorizontalScroll, expectTouchTargets, setTextZoom } from '../support/mobile';

// Composer mon séjour (maquette) : `/fr/composer`. Données du seed : écolodge, balade à cheval,
// quad et table réservables en ligne ; villa, campement et pirogue « sur demande ».

const PATH = '/fr/composer';

test.describe('composer mon séjour @checkout', () => {
  test('page à 360 px : trois étapes, récapitulatif, axe, cibles, zoom 200 %', async ({ page }) => {
    await page.goto(PATH);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Composez votre évasion');
    for (const step of ['Votre hébergement', 'Vos expériences', 'Votre arrivée']) {
      await expect(page.getByRole('heading', { name: step, level: 2 })).toBeVisible();
    }
    const summary = page.getByRole('complementary', { name: 'Récapitulatif' });
    await expect(summary.getByText(/FCFA/).first()).toBeVisible();
    await expectNoAxeViolations(page, 'composer');
    await expectTouchTargets(page);
    await expectNoHorizontalScroll(page);
    await setTextZoom(page, 2);
    await expectNoHorizontalScroll(page);
  });

  test('le total suit les choix ; une offre « sur demande » mène à une demande', async ({
    page,
  }) => {
    await page.goto(PATH);
    const summary = page.getByRole('complementary', { name: 'Récapitulatif' });
    const submit = summary.getByRole('button', { name: /^Réserver/ });
    const before = await submit.textContent();
    await page.getByText('Table du Saloum chez l’habitant').click();
    await expect(submit).not.toHaveText(before ?? '');
    await expect(summary.getByText(/Table du Saloum chez l’habitant × 2/)).toBeVisible();

    await page.getByText('Villa avec piscine à Ndangane').click();
    await expect(summary.getByRole('button', { name: 'Envoyer ma demande' })).toBeVisible();
    await summary.getByRole('button', { name: 'Envoyer ma demande' }).click();
    await expect(page).toHaveURL(/\/fr\/demande\?.*accommodation=villa-piscine-ndangane/);
    await expect(page.getByText('Villa avec piscine à Ndangane').first()).toBeVisible();
  });

  test('séjour réservable : le panier reçoit hébergement, expériences et transfert', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.goto(PATH);
    const summary = page.getByRole('complementary', { name: 'Récapitulatif' });
    // Expériences présélectionnées (les deux premières réservables en ligne, selon la base).
    const chosen = await page
      .locator('input[name="experience"]:checked')
      .evaluateAll((inputs) =>
        inputs.map(
          (input) => input.closest('label')?.querySelector('.leading-snug')?.textContent ?? '',
        ),
      );
    expect(chosen).toHaveLength(2);
    await summary.getByRole('button', { name: /^Réserver/ }).click();
    await expect(page).toHaveURL(/\/fr\/panier\?compose=1/);
    for (const title of ['Écolodge des bolongs', ...chosen, 'Aéroport AIBD → Sine-Saloum']) {
      await expect(page.getByText(title).first()).toBeVisible();
    }
  });
});
