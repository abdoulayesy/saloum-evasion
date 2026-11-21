import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from './support/a11y';
import { expectNoHorizontalScroll, expectTouchTargets } from './support/mobile';

// T023 (004, US1) : un guide lu à 360 px — signature, table des matières, offres liées, auteur,
// WhatsApp, bascule de langue ; page d'auteur. Données : `SEED_GUIDES_DEMO_PUBLISH=1 pnpm
// seed:guides` (guides de démonstration, environnements de test seulement).

const GUIDE = '/fr/carnets-du-saloum/guide-de-demonstration';
const GUIDE_EN = '/en/saloum-travel-guides/demonstration-guide';
const GUIDE_FR_ONLY = '/fr/carnets-du-saloum/guide-de-demonstration-francais';
const AUTHOR = '/fr/equipe/membre-demo-1';

test.describe('Carnets du Saloum — lire un guide @guides', () => {
  test('signature : auteur lié à sa page, relecteur, date de mise à jour, temps de lecture', async ({
    page,
  }) => {
    await page.goto(GUIDE);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Guide de démonstration des Carnets du Saloum',
    );
    const byline = page.locator('h1 ~ div').first();
    await expect(byline.getByRole('link').first()).toHaveAttribute('href', AUTHOR);
    await expect(byline).toContainText('Relu par');
    await expect(byline.locator('time')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}$/);
    await expect(byline).toContainText(/\d+ min de lecture/);
    await expectTouchTargets(page);
    await expectNoHorizontalScroll(page);
  });

  test('table des matières : une entrée mène à sa section, visible sous l’en-tête', async ({
    page,
  }) => {
    await page.goto(GUIDE);
    const toc = page.getByRole('navigation', { name: 'Sommaire' });
    await expect(toc.getByRole('link')).toHaveCount(3);
    await toc.getByRole('link', { name: 'Venir à Ndangane' }).click();
    await expect(page).toHaveURL(/#venir-a-ndangane$/);
    const heading = page.getByRole('heading', { level: 2, name: 'Venir à Ndangane' });
    await expect(heading).toBeInViewport();
    const headerBottom = await page
      .locator('header')
      .first()
      .evaluate((header) => {
        const { position } = getComputedStyle(header);
        return position === 'sticky' || position === 'fixed'
          ? header.getBoundingClientRect().bottom
          : 0;
      });
    const top = (await heading.boundingBox())?.y ?? 0;
    expect(top).toBeGreaterThanOrEqual(headerBottom - 1);
  });

  test('offres liées en FCFA, présentation de l’auteur, WhatsApp, encadré pratique', async ({
    page,
  }) => {
    await page.goto(GUIDE);
    const offers = page.locator('section[aria-labelledby="guide-offres"]');
    await expect(offers.locator('a[href="/fr/sejours/week-end-bolong-ndangane"]')).toBeVisible();
    await expect(offers.locator('[data-guide-link="destination"]')).toHaveCount(2);
    await expect(offers).toContainText('FCFA');
    await expect(page.getByRole('heading', { name: 'L’auteur' })).toBeVisible();
    await expect(page.locator('[data-guide-contact] a[href^="https://wa.me/"]')).toBeVisible();
    await expect(page.getByRole('complementary', { name: /Marées/ })).toBeVisible();
    await expectNoAxeViolations(page, 'guide');
  });

  test('bascule de langue : même guide en anglais ; sans traduction, rubrique anglaise', async ({
    page,
  }) => {
    await page.goto(GUIDE);
    await page.getByRole('link', { name: 'EN, English version' }).click();
    await expect(page).toHaveURL(new RegExp(`${GUIDE_EN}$`));
    await page.goto(GUIDE_FR_ONLY);
    await expect(page.getByRole('navigation', { name: 'Sommaire' })).toHaveCount(0);
    await page.getByRole('link', { name: 'EN, English version' }).click();
    await expect(page).toHaveURL(/\/en\/saloum-travel-guides(\?.*)?$/);
  });

  test('page d’auteur : présentation et liste de ses guides', async ({ page }) => {
    await page.goto(AUTHOR);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Membre de l’équipe 1 (démonstration)',
    );
    await expect(page.locator(`a[href="${GUIDE}"]`)).toBeVisible();
    await expect(page.locator(`a[href="${GUIDE_FR_ONLY}"]`)).toBeVisible();
    await expectNoAxeViolations(page, 'page d’auteur');
    await expectNoHorizontalScroll(page);
  });
});
