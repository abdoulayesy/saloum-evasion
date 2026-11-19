import { expect, test } from '@playwright/test';
import { expectInThumbZone } from './support/mobile';

// T158 (US5) : depuis 12 pages FR de types différents, le sélecteur mène à la page EN
// équivalente (et inversement) ; la demande en cours est conservée ; le sélecteur du menu est
// dans la zone du pouce.
const PAIRS: readonly [string, string][] = [
  ['/fr', '/en'],
  ['/fr/sejours', '/en/stays'],
  ['/fr/sejours/week-end-bolong-ndangane', '/en/stays/bolong-weekend-ndangane'],
  ['/fr/experiences', '/en/experiences'],
  ['/fr/experiences/mangrove-et-iles', '/en/experiences/mangrove-and-islands'],
  [
    '/fr/experiences/mangrove-et-iles/excursion-pirogue-bolongs',
    '/en/experiences/mangrove-and-islands/pirogue-trip-bolongs',
  ],
  ['/fr/destinations/ile-aux-oiseaux', '/en/destinations/bird-island'],
  ['/fr/hebergements/villa-piscine-ndangane', '/en/accommodation/ndangane-villa-with-pool'],
  ['/fr/film-immersion', '/en/immersion-film'],
  ['/fr/a-propos', '/en/about'],
  ['/fr/faq', '/en/faq'],
  ['/fr/demande', '/en/request'],
];

const escape = (path: string): string => path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test.describe('US5 — bascule de langue sur la même page', () => {
  test('12 pages FR → page EN équivalente, puis retour', async ({ page }) => {
    test.slow();
    for (const [fr, en] of PAIRS) {
      await page.goto(fr);
      await page.getByRole('link', { name: 'EN, English version' }).click();
      await expect(page, `${fr} → ${en}`).toHaveURL(new RegExp(`${escape(en)}$`));
    }
    const [frBack, enBack] = PAIRS[2] ?? ['', ''];
    await page.goto(enBack);
    await page.getByRole('link', { name: 'FR, version française' }).click();
    await expect(page).toHaveURL(new RegExp(`${escape(frBack)}$`));
  });

  test('la demande en cours est conservée en changeant de langue', async ({ page }) => {
    await page.goto('/fr/experiences/mangrove-et-iles/excursion-pirogue-bolongs');
    await page
      .locator('[data-sticky-action-bar]')
      .getByRole('link', { name: 'Ajouter à ma demande' })
      .click();
    await expect(page.getByRole('link', { name: 'Ma demande : 1 élément' })).toBeVisible();
    await page.getByRole('link', { name: 'EN, English version' }).click();
    await expect(page).toHaveURL(/\/en\/experiences\/mangrove-and-islands\/pirogue-trip-bolongs$/);
    await expect(page.getByRole('link', { name: 'My request: 1 item' })).toBeVisible();
  });

  test('sélecteur du menu dans la zone du pouce', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Zone du pouce : mobile');
    // En paysage (moins de 500 px de haut), pas de zone du pouce : même règle que la barre collante.
    test.skip((page.viewportSize()?.height ?? 0) < 500, 'Paysage : hauteur trop faible');
    await page.goto('/fr/sejours');
    await page.getByRole('link', { name: 'Menu' }).click();
    const link = page.getByRole('dialog').getByRole('link', { name: 'EN, English version' });
    await expect(link).toBeVisible();
    await expectInThumbZone(link);
    await link.click();
    await expect(page).toHaveURL(/\/en\/stays$/);
  });

  test('navigateur en anglais : bandeau sur les pages FR, refermable, sans redirection', async ({
    browser,
  }) => {
    const context = await browser.newContext({ locale: 'en-GB' });
    const page = await context.newPage();
    await page.goto('/fr/sejours');
    await expect(page).toHaveURL(/\/fr\/sejours$/);
    const banner = page.getByText('This page is also available in English.');
    // Affiché à la première interaction, pas au chargement (élément LCP sinon) : touche répétée
    // jusqu'à ce que l'îlot soit hydraté et écoute.
    await expect(banner).toBeHidden();
    await expect(async () => {
      await page.keyboard.press('Shift');
      await expect(banner).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(banner).toBeHidden();
    await page.goto('/fr/destinations');
    await page.keyboard.press('Shift');
    await expect(page.getByText('This page is also available in English.')).toBeHidden();
    await context.close();
  });
});
