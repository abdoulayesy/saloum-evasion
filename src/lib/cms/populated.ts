// Les relations Payload valent un identifiant (profondeur 0) ou le document (profondeur ≥ 1).

/** Document peuplé, ou `null` si la relation n'est qu'un identifiant ou est vide. */
export const populated = <T extends object>(value: number | T | null | undefined): T | null =>
  typeof value === 'object' && value !== null ? value : null;

/** Documents peuplés d'une relation multiple, identifiants ignorés. */
export const populatedList = <T extends object>(
  values: readonly (number | T)[] | null | undefined,
): T[] => (values ?? []).flatMap((value) => (typeof value === 'object' ? [value] : []));
