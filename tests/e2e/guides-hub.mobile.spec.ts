import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from './support/a11y';
import { expectNoHorizontalScroll, expectTouchTargets } from './support/mobile';

// T056 (004, US4) : rubrique « Carnets du Saloum » à 360 px — guides regroupés par thème, cartes
// (image, titre, chapeau, temps de lecture), liens du menu et du pied de page, carte d'un membre
// sur « À propos » menant à sa page d'auteur. Données : guides de démonstration.

const HUB = '/fr/carnets-du-saloum';

test.describe('Carnets du Saloum — rubrique @guides', () => {
  test('guides regroupés par thème, cartes complètes, axe', async ({ page }) => {
    await page.goto(HUB);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Carnets du Saloum');
    await expect(page.getByRole('heading', { level: 2, name: 'Que faire' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Culture et nature' })).toBeVisible();
    const card = page.getByRole('link', { name: 'Guide de démonstration des Carnets du Saloum' });
    await expect(card).toHaveAttribute('href', `${HUB}/guide-de-demonstration`);
    const article = page.locator('article', { has: card });
    await expect(article.locator('img')).toBeVisible();
    await expect(article).toContainText('Guide de démonstration utilisé par les tests');
    await expect(article).toContainText(/\d+ min de lecture/);
    await expectNoAxeViolations(page, 'rubrique des Carnets');
    await expectTouchTargets(page);
    await expectNoHorizontalScroll(page);
  });

  test('anglais : seuls les guides traduits', async ({ page }) => {
    await page.goto('/en/saloum-travel-guides');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Saloum Travel Guides');
    await expect(
      page.getByRole('link', { name: 'Saloum Travel Guides demonstration guide' }),
    ).toBeVisible();
    await expect(page.getByText('Second guide de démonstration')).toHaveCount(0);
  });

  test('pied de page et menu mènent à la rubrique', async ({ page }) => {
    await page.goto('/fr');
    await expect(page.locator(`footer a[href="${HUB}"]`)).toBeVisible();
    await page.getByRole('link', { name: 'Menu' }).click();
    await expect(
      page.getByRole('dialog', { name: 'Menu' }).locator(`a[href="${HUB}"]`),
    ).toBeVisible();
  });

  test('« À propos » : le nom d’un membre qui signe un guide mène à sa page d’auteur', async ({
    page,
  }) => {
    await page.goto('/fr/a-propos');
    await expect(page.locator('a[href="/fr/equipe/membre-demo-1"]').first()).toBeVisible();
  });
});
