import { expect, type Locator, type Page } from '@playwright/test';

type TargetIssue = { selector: string; width: number; height: number };

/**
 * Constitution I : cibles tactiles ≥ 44 × 44 px.
 * Exclut les liens insérés dans un paragraphe de texte (exception WCAG 2.5.8 « inline »)
 * et les éléments masqués.
 */
export const expectTouchTargets = async (page: Page, minSize = 44): Promise<void> => {
  const issues = await page.evaluate((min): TargetIssue[] => {
    const interactive = document.querySelectorAll<HTMLElement>(
      'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [tabindex]:not([tabindex="-1"])',
    );
    const found: TargetIssue[] = [];
    interactive.forEach((element) => {
      if (element.closest('p, li > p, figcaption, .prose')) return;
      if (element.classList.contains('skip-link')) return;
      // Masqué aux technologies d'assistance et hors tabulation (pot de miel) : pas une cible.
      if (element.closest('[aria-hidden="true"]')) return;
      const style = window.getComputedStyle(element);
      if (style.visibility === 'hidden' || style.display === 'none') return;
      // Case à cocher ou bouton radio masqué visuellement : la cible réelle est son étiquette.
      const label = element instanceof HTMLInputElement ? element.closest('label') : null;
      const rect = (label ?? element).getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;
      if (rect.width < min || rect.height < min) {
        const id = element.id ? `#${element.id}` : '';
        const text = (element.textContent ?? '').trim().slice(0, 30);
        found.push({
          selector: `${element.tagName.toLowerCase()}${id} « ${text} »`,
          width: rect.width,
          height: rect.height,
        });
      }
    });
    return found;
  }, minSize);
  expect(issues, `Cibles tactiles < ${minSize} px`).toEqual([]);
};

/** Aucun défilement horizontal (WCAG 1.4.10, 360 px). */
export const expectNoHorizontalScroll = async (page: Page): Promise<void> => {
  const { overflow, culprits } = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    // Éléments qui dépassent à droite : nommés dans le message d'échec (diagnostic en CI).
    const offenders = [...document.querySelectorAll('body *')]
      .map((el) => ({ el, right: Math.round(el.getBoundingClientRect().right) }))
      .filter(({ right }) => right > width)
      .sort((a, b) => b.right - a.right)
      .slice(0, 5)
      .map(
        ({ el, right }) =>
          `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}.${String(el.className).slice(0, 60)} → ${right}px`,
      );
    return { overflow: document.documentElement.scrollWidth - width, culprits: offenders };
  });
  expect(
    overflow,
    `Défilement horizontal en px (${culprits.join(' ; ') || 'aucun élément'})`,
  ).toBeLessThanOrEqual(0);
};

/** Agrandit le texte (taille racine) : 2 = 200 % (WCAG 1.4.4). Les tailles sont en rem (Stylelint). */
export const setTextZoom = async (page: Page, factor: number): Promise<void> => {
  await page.evaluate((value) => {
    document.documentElement.style.fontSize = `${value * 100}%`;
  }, factor);
};

/** L'élément qui a le focus n'est pas masqué par un élément fixe ou collant (WCAG 2.4.11). */
export const expectFocusNotObscured = async (page: Page): Promise<void> => {
  const obscured = await page.evaluate(() => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || active === document.body) return false;
    const rect = active.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const top = document.elementFromPoint(x, y);
    return top !== null && top !== active && !active.contains(top);
  });
  expect(obscured, "L'élément actif est masqué").toBe(false);
};

/** Le centre de l'élément est dans le tiers inférieur de la fenêtre (zone du pouce). */
export const expectInThumbZone = async (locator: Locator): Promise<void> => {
  const box = await locator.boundingBox();
  const viewport = locator.page().viewportSize();
  expect(box, 'Élément introuvable ou invisible').not.toBeNull();
  expect(viewport).not.toBeNull();
  if (!box || !viewport) return;
  const centerY = box.y + box.height / 2;
  expect(centerY, 'Hors de la zone du pouce (tiers inférieur)').toBeGreaterThanOrEqual(
    (viewport.height * 2) / 3,
  );
};
