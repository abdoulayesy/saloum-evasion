// Logique pure des redirections automatiques (T066, constitution III : toute URL modifiée
// reçoit une 301). Aucune dépendance au CMS : testée dans tests/unit/autoRedirect.test.ts.

export type RedirectRule = { from: string; to: string };

export type RedirectPlan = {
  /** Règles à créer ou à mettre à jour (clé : `from`). */
  upsert: RedirectRule[];
  /** Chemins `from` dont la règle doit disparaître. */
  remove: string[];
};

/**
 * Intègre de nouvelles redirections dans la table existante :
 * - aplatit les chaînes (A → B puis B → C devient A → C, un seul saut) ;
 * - supprime les boucles (A → B puis B → A : la règle A → B disparaît) ;
 * - retire toute règle dont l'origine est redevenue une page publiée (`livePaths`).
 */
export const planRedirects = (
  existing: readonly RedirectRule[],
  added: readonly RedirectRule[],
  livePaths: readonly string[] = [],
): RedirectPlan => {
  const table = new Map(existing.map((rule) => [rule.from, rule.to]));
  const initial = new Map(table);

  for (const rule of added) {
    if (rule.from === rule.to) continue;
    // Les règles qui menaient à l'ancienne adresse mènent désormais à la nouvelle.
    for (const [from, to] of table) {
      if (to === rule.from) table.set(from, rule.to);
    }
    table.set(rule.from, rule.to);
    // La destination est une page vivante : elle ne doit plus rediriger ailleurs.
    table.delete(rule.to);
  }
  for (const path of livePaths) table.delete(path);
  for (const [from, to] of table) {
    if (from === to) table.delete(from);
  }

  const upsert: RedirectRule[] = [];
  for (const [from, to] of table) {
    if (initial.get(from) !== to) upsert.push({ from, to });
  }
  const remove = [...initial.keys()].filter((from) => !table.has(from));
  return { upsert, remove };
};

/** Résout un chemin dans la table compilée (un seul saut garanti par `planRedirects`). */
export const resolveRedirect = (
  table: ReadonlyMap<string, string>,
  pathname: string,
): string | null => table.get(pathname) ?? null;
