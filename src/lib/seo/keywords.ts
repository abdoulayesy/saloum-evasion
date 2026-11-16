// Mots-clés cibles (spec FR-026, SC-005 ; seo CHK042, CHK043) : pour chacun, sa page principale
// en français et l'équivalent anglais. `terms` = termes qui doivent figurer dans le contenu
// principal de la page (sans accents ni casse) ; le premier doit aussi figurer dans le title ou
// le H1. Contrôlé par scripts/seo-check.ts. Pages du jeu de démonstration : à revoir avec le
// contenu réel avant le lancement.

export type KeywordTarget = { keyword: string; path: string; terms: readonly string[] };

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
      keyword: 'que faire au Sine-Saloum',
      path: '/fr/experiences',
      terms: ['que faire', 'sine-saloum'],
    },
    en: {
      keyword: 'things to do in Sine-Saloum',
      path: '/en/experiences',
      terms: ['things to do', 'sine-saloum'],
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
];

/** Texte comparable : minuscules, sans accents, apostrophes et espaces normalisés. */
export const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\s+/g, ' ');
