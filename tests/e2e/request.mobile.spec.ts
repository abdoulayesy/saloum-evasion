import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from './support/a11y';
import { expectNoHorizontalScroll, expectTouchTargets, setTextZoom } from './support/mobile';
import {
  fillRequiredFields,
  findOutboxMessage,
  uniqueName,
  waitAntiBotDelay,
} from './support/request';

// T150 : formulaire de demande à 360 px — claviers, erreurs, double envoi, hors connexion,
// confirmation, axe sur chaque état, clavier seul, zoom 200 %.
const FORM = '/fr/demande?stay=week-end-bolong-ndangane';

test.describe('demande de séjour', () => {
  test('claviers et remplissage automatique de chaque champ', async ({ page }) => {
    await page.goto(FORM);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Demander un séjour');
    await expect(page.getByLabel('Arrivée')).toHaveAttribute('type', 'date');
    await expect(page.getByLabel('Prénom')).toHaveAttribute('autocomplete', 'given-name');
    const phone = page.locator('#whatsappLocal');
    await expect(phone).toHaveAttribute('type', 'tel');
    await expect(phone).toHaveAttribute('inputmode', 'tel');
    await expect(page.getByLabel('Indicatif')).toHaveValue('+221');
    await expect(page.getByLabel('E-mail (facultatif)')).toHaveAttribute('type', 'email');
    await expect(page.getByLabel('E-mail (facultatif)')).toHaveAttribute('autocomplete', 'email');
    await expect(page.getByLabel('Adultes')).toHaveAttribute('inputmode', 'numeric');
    // Élément pré-rempli depuis la fiche, conditions d'annulation au-dessus du bouton.
    await expect(page.getByRole('checkbox', { name: /Week-end bolong à Ndangane/ })).toBeChecked();
    await expect(page.getByRole('heading', { name: 'Conditions d’annulation' })).toBeVisible();
  });

  test('steppers de 44 px', async ({ page }) => {
    await page.goto(FORM);
    await page.getByRole('button', { name: 'Un adulte de plus' }).click();
    await expect(page.getByLabel('Adultes')).toHaveValue('3');
    await page.getByRole('button', { name: 'Un enfant de plus' }).click();
    await expect(page.getByLabel('Enfants (moins de 12 ans)')).toHaveValue('1');
    await expect(page.getByRole('button', { name: 'Un enfant de moins' })).toBeEnabled();
  });

  test('erreurs : résumé, focus sur le premier champ fautif, axe', async ({ page }) => {
    await page.goto(FORM);
    await waitAntiBotDelay(page);
    await page.getByRole('button', { name: 'Envoyer ma demande' }).click();
    await expect(page.locator('#demande-erreurs')).toContainText('Merci de corriger');
    await expect(page.getByLabel('Arrivée')).toBeFocused();
    await expect(page.getByLabel('Arrivée')).toHaveAttribute('aria-invalid', 'true');
    await expectNoAxeViolations(page, 'formulaire en erreur');
  });

  test('envoi : confirmation sur place, e-mail à l’équipe, double appui sans doublon', async ({
    page,
  }) => {
    const firstName = uniqueName();
    await page.goto(FORM);
    await expectNoAxeViolations(page, 'formulaire');
    await expectTouchTargets(page);
    await fillRequiredFields(page, { firstName });
    await waitAntiBotDelay(page);
    const submit = page.getByRole('button', { name: 'Envoyer ma demande' });
    await submit.dblclick();
    await expect(page.getByRole('heading', { name: 'Demande envoyée' })).toBeVisible();
    await expect(page.getByText(/Référence : SE-\d{8}-[A-Z0-9]{4}/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Envoyer aussi sur WhatsApp' })).toHaveAttribute(
      'href',
      /^https:\/\/wa\.me\/\d+\?text=.*SE-/,
    );
    await expectNoAxeViolations(page, 'confirmation');
    const mail = await findOutboxMessage(firstName);
    expect(mail.text).toContain('Week-end bolong à Ndangane');
    // Un seul e-mail pour ce prénom malgré le double appui.
    expect(mail.subject).toMatch(/^\[Demande SE-\d{8}-[A-Z0-9]{4}\]/);
  });

  test('hors connexion : saisies conservées, message et repli WhatsApp', async ({ page }) => {
    const firstName = uniqueName();
    await page.goto(FORM);
    await fillRequiredFields(page, { firstName });
    await waitAntiBotDelay(page);
    await page.context().setOffline(true);
    await page.getByRole('button', { name: 'Envoyer ma demande' }).click();
    await expect(page.getByText(/hors connexion/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Écrire sur WhatsApp' }).first()).toBeVisible();
    await expect(page.getByLabel('Prénom')).toHaveValue(firstName);
    await page.context().setOffline(false);
  });

  test('envoi au clavier seul', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Parcours clavier mesuré sur ordinateur');
    const firstName = uniqueName();
    await page.goto(FORM);
    await page.getByLabel('Arrivée').focus();
    await fillRequiredFields(page, { firstName });
    await waitAntiBotDelay(page);
    await page.getByRole('button', { name: 'Envoyer ma demande' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Demande envoyée' })).toBeVisible();
  });

  test('zoom 200 % et paysage sans défilement horizontal', async ({ page }) => {
    await page.goto(FORM);
    // Après hydratation : les boutons − / + des voyageurs n'existent qu'avec JavaScript, et
    // élargissent la ligne (mesurer avant eux masquait le débordement).
    await expect(page.getByRole('button', { name: 'Un adulte de plus' })).toBeVisible();
    await expectNoHorizontalScroll(page);
    await setTextZoom(page, 2);
    await expectNoHorizontalScroll(page);
  });
});
