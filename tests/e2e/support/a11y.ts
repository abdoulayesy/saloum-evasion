import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

// Constitution IV : axe sans aucune erreur, WCAG 2.0 à 2.2 niveaux A et AA.
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/**
 * Échoue à la moindre violation axe. `label` identifie l'état testé (page, menu ouvert…) ;
 * `include` limite l'analyse à une zone (vues personnalisées de l'admin, hors interface Payload).
 */
export const expectNoAxeViolations = async (
  page: Page,
  label: string,
  { include }: { include?: string } = {},
): Promise<void> => {
  const builder = new AxeBuilder({ page }).withTags(WCAG_TAGS);
  const results = await (include ? builder.include(include) : builder).analyze();
  const summary = results.violations.map(
    (violation) =>
      `${violation.id} (${violation.impact ?? 'n/a'}) : ${violation.help} → ${violation.nodes
        .map((node) => node.target.join(' '))
        .join(', ')}`,
  );
  expect(summary, `Violations axe — ${label}`).toEqual([]);
};
