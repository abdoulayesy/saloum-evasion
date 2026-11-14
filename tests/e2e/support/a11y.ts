import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

// Constitution IV : axe sans aucune erreur, WCAG 2.0 à 2.2 niveaux A et AA.
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** Échoue à la moindre violation axe. `label` identifie l'état testé (page, menu ouvert…). */
export const expectNoAxeViolations = async (page: Page, label: string): Promise<void> => {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const summary = results.violations.map(
    (violation) =>
      `${violation.id} (${violation.impact ?? 'n/a'}) : ${violation.help} → ${violation.nodes
        .map((node) => node.target.join(' '))
        .join(', ')}`,
  );
  expect(summary, `Violations axe — ${label}`).toEqual([]);
};
