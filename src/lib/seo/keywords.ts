// Mots-clés cibles (spec FR-026, SC-005 ; seo CHK042, CHK043) : pour chacun, sa page principale
// en français et l'équivalent anglais. `terms` = termes qui doivent figurer dans le contenu
// principal de la page (sans accents ni casse) ; le premier doit aussi figurer dans le title ou
// le H1. Contrôlé par scripts/seo-check.ts. Pages du jeu de démonstration : à revoir avec le
// contenu réel avant le lancement.

export type KeywordTarget = {
  keyword: string;
  path: string;
  terms: readonly string[];
  /**
   * Page pas encore publiée (guide en brouillon, 004) : tant qu'elle répond 404, seo-check ne
   * vérifie que l'unicité de la requête et l'affiche en avertissement. À retirer à la publication.
   */
  pendingPublication?: boolean;
};

export type TargetKeyword = { fr: KeywordTarget; en: KeywordTarget };

export const TARGET_KEYWORDS: readonly TargetKeyword[] = [
  {
    fr: { keyword: 'séjour Sine-Saloum', path: '/fr/sejours', terms: ['sejour', 'sine-saloum'] },
    en: { keyword: 'Sine-Saloum stay', path: '/en/stays', terms: ['stay', 'sine-saloum'] },
  },
  {
    fr: {
      keyword: 'week-end Ndangane',
      path: '/fr/sejours/week-end-bolong-ndangane',
      terms: ['week-end', 'ndangane'],
    },
    en: {
      keyword: 'Ndangane weekend',
      path: '/en/stays/bolong-weekend-ndangane',
      terms: ['weekend', 'ndangane'],
    },
  },
  {
    fr: {
      // 004 (clarification du 2026-11-20) : « que faire au Sine-Saloum » passe au guide.
      keyword: 'activités Sine-Saloum',
      path: '/fr/experiences',
      terms: ['activites', 'sine-saloum'],
    },
    en: {
      keyword: 'Sine-Saloum activities',
      path: '/en/experiences',
      terms: ['activities', 'sine-saloum'],
    },
  },
  {
    fr: {
      keyword: 'excursion pirogue Sine-Saloum',
      path: '/fr/experiences/mangrove-et-iles/excursion-pirogue-bolongs',
      terms: ['pirogue', 'excursion', 'sine-saloum'],
    },
    en: {
      keyword: 'Sine-Saloum pirogue trip',
      path: '/en/experiences/mangrove-and-islands/pirogue-trip-bolongs',
      terms: ['pirogue', 'sine-saloum'],
    },
  },
  {
    fr: {
      keyword: 'île aux Oiseaux Saloum',
      path: '/fr/destinations/ile-aux-oiseaux',
      terms: ['ile aux oiseaux', 'saloum'],
    },
    en: {
      keyword: 'Bird Island Saloum',
      path: '/en/destinations/bird-island',
      terms: ['bird island', 'saloum'],
    },
  },
  {
    fr: {
      keyword: 'villa piscine Ndangane',
      path: '/fr/hebergements/villa-piscine-ndangane',
      terms: ['villa', 'piscine', 'ndangane'],
    },
    en: {
      keyword: 'Ndangane villa with pool',
      path: '/en/accommodation/ndangane-villa-with-pool',
      terms: ['villa', 'pool', 'ndangane'],
    },
  },
  {
    fr: {
      keyword: 'lodge Sine-Saloum',
      path: '/fr/hebergements/ecolodge-des-bolongs',
      terms: ['lodge', 'sine-saloum'],
    },
    en: {
      keyword: 'Sine-Saloum lodge',
      path: '/en/accommodation/bolong-eco-lodge',
      terms: ['lodge', 'sine-saloum'],
    },
  },
  {
    fr: {
      keyword: 'quad Sine-Saloum',
      path: '/fr/experiences/terre-et-villages/quad-sine-saloum',
      terms: ['quad', 'sine-saloum'],
    },
    en: {
      keyword: 'Sine-Saloum quad bike',
      path: '/en/experiences/land-and-villages/quad-sine-saloum',
      terms: ['quad', 'sine-saloum'],
    },
  },
  {
    fr: {
      keyword: 'balade à cheval Palmarin',
      path: '/fr/experiences/terre-et-villages/balade-cheval-palmarin',
      terms: ['cheval', 'palmarin', 'balade'],
    },
    en: {
      keyword: 'Palmarin horse ride',
      path: '/en/experiences/land-and-villages/horse-ride-palmarin',
      terms: ['horse', 'palmarin'],
    },
  },
  {
    fr: { keyword: 'Mar Lodj', path: '/fr/destinations/mar-lodj', terms: ['mar lodj'] },
    en: { keyword: 'Mar Lodj', path: '/en/destinations/mar-lodj', terms: ['mar lodj'] },
  },
  // 004 : guides des Carnets du Saloum (spec FR-020), brouillons jusqu'à leur publication.
  {
    fr: {
      keyword: 'que faire au Sine-Saloum',
      path: '/fr/carnets-du-saloum/que-faire-au-sine-saloum',
      terms: ['que faire', 'sine-saloum'],
      pendingPublication: true,
    },
    en: {
      keyword: 'things to do in Sine-Saloum',
      path: '/en/saloum-travel-guides/things-to-do-sine-saloum',
      terms: ['things to do', 'sine-saloum'],
      pendingPublication: true,
    },
  },
  {
    fr: {
      keyword: 'quand partir au Sine-Saloum',
      path: '/fr/carnets-du-saloum/quand-partir-au-sine-saloum',
      terms: ['quand partir', 'sine-saloum'],
      pendingPublication: true,
    },
    en: {
      keyword: 'best time to visit Sine-Saloum',
      path: '/en/saloum-travel-guides/best-time-to-visit-sine-saloum',
      terms: ['best time', 'sine-saloum'],
      pendingPublication: true,
    },
  },
  {
    fr: {
      keyword: 'Dakar Ndangane',
      path: '/fr/carnets-du-saloum/aller-de-dakar-a-ndangane',
      terms: ['ndangane', 'dakar'],
      pendingPublication: true,
    },
    en: {
      keyword: 'Dakar to Ndangane',
      path: '/en/saloum-travel-guides/dakar-to-ndangane',
      terms: ['ndangane', 'dakar'],
      pendingPublication: true,
    },
  },
  {
    fr: {
      keyword: 'week-end Sine-Saloum depuis Dakar',
      path: '/fr/carnets-du-saloum/week-end-sine-saloum-depuis-dakar',
      terms: ['week-end', 'sine-saloum', 'dakar'],
      pendingPublication: true,
    },
    en: {
      keyword: 'Sine-Saloum weekend from Dakar',
      path: '/en/saloum-travel-guides/sine-saloum-weekend-from-dakar',
      terms: ['weekend', 'sine-saloum', 'dakar'],
      pendingPublication: true,
    },
  },
  {
    fr: {
      keyword: 'huîtres de palétuviers Sénégal',
      path: '/fr/carnets-du-saloum/huitres-de-paletuviers',
      terms: ['huitres', 'paletuviers'],
      pendingPublication: true,
    },
    en: {
      keyword: 'mangrove oysters Senegal',
      path: '/en/saloum-travel-guides/mangrove-oysters-senegal',
      terms: ['oysters', 'mangrove'],
      pendingPublication: true,
    },
  },
  {
    fr: {
      keyword: 'culture sérère',
      path: '/fr/carnets-du-saloum/culture-serere',
      terms: ['culture serere'],
      pendingPublication: true,
    },
    en: {
      keyword: 'Serer culture',
      path: '/en/saloum-travel-guides/serer-culture',
      terms: ['serer culture'],
      pendingPublication: true,
    },
  },
  {
    fr: {
      keyword: 'que faire à Mar Lodj',
      path: '/fr/carnets-du-saloum/mar-lodj-ile-sans-voitures',
      terms: ['mar lodj', 'que faire'],
      pendingPublication: true,
    },
    en: {
      keyword: 'things to do in Mar Lodj',
      path: '/en/saloum-travel-guides/mar-lodj-car-free-island',
      terms: ['mar lodj', 'things to do'],
      pendingPublication: true,
    },
  },
];

/** Texte comparable : minuscules, sans accents, apostrophes et espaces normalisés. */
export const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\s+/g, ' ');

export type KeywordDuplicate = { keyword: string; paths: string[] };

/**
 * Requêtes visant plusieurs chemins dans une même langue (FR-020b : une requête, une page). La
 * même requête peut exister en français et en anglais (ex. « Mar Lodj ») : comparée par langue.
 */
export const duplicateKeywords = (targets: readonly TargetKeyword[]): KeywordDuplicate[] =>
  (['fr', 'en'] as const).flatMap((locale) => {
    const byKeyword = new Map<string, string[]>();
    for (const entry of targets) {
      const target = entry[locale];
      const keyword = normalizeText(target.keyword);
      byKeyword.set(keyword, [...(byKeyword.get(keyword) ?? []), target.path]);
    }
    return [...byKeyword]
      .filter(([, paths]) => new Set(paths).size > 1)
      .map(([keyword, paths]) => ({ keyword, paths }));
  });
