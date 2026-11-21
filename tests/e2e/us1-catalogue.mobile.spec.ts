import { expect, test } from '@playwright/test';
import { applyNetwork } from './support/network';

// T099 (Android 360, profil 3G, Chromium) : accueil → recherche → liste « week-end » → fiche.
// La durée est mesurée et enregistrée ; la limite de 120 s porte sur le parcours complet
// avec la demande (T152).
test('@chromium-only parcours catalogue en 3G : accueil → recherche → liste → fiche', async ({
  page,
  browserName,
}, testInfo) => {
  test.skip(browserName !== 'chromium', 'Profil réseau CDP : Chromium seulement');
  test.setTimeout(120_000);
  await applyNetwork(page, '3g');
  const start = Date.now();

  await page.goto('/fr');
  // Raccourci du héro sur téléphone ; sur grand écran la barre de recherche est déjà visible.
  const shortcut = page.getByRole('link', { name: 'Trouver mon séjour' });
  if (await shortcut.isVisible()) await shortcut.click();
  await page.getByLabel('Durée').selectOption('weekend');
  await page.getByRole('button', { name: 'Voir les séjours' }).click();

  await expect(page).toHaveURL(/\/fr\/sejours\?.*duree=weekend/);
  await expect(page.locator('#resultats-nombre')).toHaveText('1 séjour');
  await page.locator('li:not([hidden]) > [data-stay-card] a').first().click();

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Week-end bolong à Ndangane');
  await expect(page.getByText(/180\s000\sFCFA/).first()).toBeVisible();

  const seconds = Math.round((Date.now() - start) / 100) / 10;
  testInfo.annotations.push({ type: 'durée du parcours (3G)', description: `${seconds} s` });
  console.log(`Parcours catalogue en 3G : ${seconds} s`);
});
