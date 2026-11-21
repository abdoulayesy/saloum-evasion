import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from './support/a11y';
import { expectNoHorizontalScroll, expectTouchTargets, setTextZoom } from './support/mobile';

// T136 : les six pages institutionnelles à 360 px.
const PAGES = [
  { path: '/fr/notre-engagement', h1: 'Notre engagement' },
  { path: '/fr/a-propos', h1: 'À propos' },
  { path: '/fr/faq', h1: 'Questions fréquentes' },
  { path: '/fr/contact', h1: 'Contact' },
  { path: '/fr/mentions-legales', h1: 'Mentions légales' },
  { path: '/fr/confidentialite', h1: 'Confidentialité' },
] as const;

test.describe('pages institutionnelles', () => {
  for (const { path, h1 } of PAGES) {
    test(`${h1} : axe, cibles, zoom 200 %`, async ({ page }) => {
      test.slow();
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(h1);
      await expectNoAxeViolations(page, h1);
      await expectTouchTargets(page);
      await expectNoHorizontalScroll(page);
      await setTextZoom(page, 2);
      await expectNoHorizontalScroll(page);
    });
  }

  test('FAQ : questions par catégorie, ouverture au clavier', async ({ page }) => {
    await page.goto('/fr/faq');
    for (const category of ['Réservation', 'Paiement', 'Transport']) {
      await expect(
        page.getByRole('heading', { name: category, level: 2, exact: true }),
      ).toBeVisible();
    }
    const summary = page.locator('summary').first();
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('details').first()).toHaveAttribute('open', '');
    await expectNoAxeViolations(page, 'FAQ ouverte');
  });

  test('contact : coordonnées, lien WhatsApp, carte', async ({ page }) => {
    await page.goto('/fr/contact');
    await expect(page.locator('main address')).toContainText('Ndangane, Fatick');
    await expect(page.getByRole('link', { name: /WhatsApp/ }).first()).toHaveAttribute(
      'href',
      /^https:\/\/wa\.me\//,
    );
    await expect(page.getByRole('heading', { name: 'Situer Saloum Évasion' })).toBeVisible();
  });

  test('à propos : l’équipe et les étapes', async ({ page }) => {
    await page.goto('/fr/a-propos');
    await expect(page.getByRole('heading', { name: 'L’équipe', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: /Membre de l’équipe/ })).toHaveCount(
      3,
    );
    await expect(
      page.getByRole('heading', { name: 'Comment se passe votre séjour' }),
    ).toBeVisible();
  });

  test('confidentialité : registre des traitements avec transferts hors du Sénégal', async ({
    page,
  }) => {
    await page.goto('/fr/confidentialite');
    for (const purpose of [
      'Demandes de séjour',
      'Mesure d’audience',
      'Lecture des vidéos',
      'Comptes de l’équipe',
      'Protection du formulaire contre les abus',
      // 004 (T074) : pages d'auteur des Carnets du Saloum.
      'Pages d’auteur de l’équipe',
    ]) {
      await expect(page.getByRole('heading', { name: purpose, level: 3 })).toBeVisible();
    }
    await expect(page.getByText('Transferts hors du Sénégal', { exact: true })).toHaveCount(6);
  });
});
