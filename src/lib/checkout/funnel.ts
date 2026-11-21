// Mesure de l'entonnoir du tunnel (002, FR-040, T106). Pur. Plausible ne calcule pas de médiane
// sur une propriété : la durée du parcours est aussi envoyée par tranche, lisible directement
// dans le tableau de bord autour de l'objectif de 3 minutes (SC-001). Médiane exacte : à partir
// des tranches ou de `durationSeconds` via l'API Stats (docs/analytics.md).

const BUCKETS: readonly [number, string][] = [
  [60, '< 1 min'],
  [180, '1–3 min'],
  [300, '3–5 min'],
  [600, '5–10 min'],
  [1800, '10–30 min'],
];

/** Tranche de durée du parcours, de la création du panier au paiement confirmé. */
export const durationBucket = (seconds: number): string =>
  BUCKETS.find(([limit]) => seconds < limit)?.[1] ?? '≥ 30 min';
