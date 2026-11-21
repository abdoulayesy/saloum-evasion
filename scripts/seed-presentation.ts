import config from '@payload-config';
import { getPayload, type Payload } from 'payload';
import { demoBody } from '@/seed/content';

// Contenus de présentation (maquettes « Accueil » et « Composer mon séjour ») sur une base déjà
// remplie par `pnpm seed` et `pnpm seed:checkout` : accroches et points forts des trois séjours
// (tous mis en avant), textes des destinations et des univers, chapitres du film, quatre vidéos
// verticales de 15 s, quatre expériences de la maquette réservables en ligne. Relançable : met à
// jour sans dupliquer. Données de DÉMONSTRATION (flux public Mux, photos fournies dont les droits
// restent à confirmer) : à remplacer avant toute mise en ligne (constitution V).

const context = { disableRevalidate: true };

type Bi = { fr: string; en: string };

const stays: { slug: string; summary: Bi; highlights: Bi[] }[] = [
  {
    slug: 'week-end-bolong-ndangane',
    summary: { fr: 'Week-end depuis Dakar', en: 'Weekend from Dakar' },
    highlights: [
      { fr: 'Villa avec piscine au bord du fleuve', en: 'Villa with a pool on the riverbank' },
      {
        fr: 'Pirogue au coucher du soleil dans la mangrove',
        en: 'Sunset pirogue trip through the mangrove',
      },
      { fr: 'Dîner d’huîtres de palétuviers grillées', en: 'Dinner of grilled mangrove oysters' },
      { fr: 'Transfert aller-retour depuis Dakar', en: 'Return transfer from Dakar' },
    ],
  },
  {
    slug: 'trois-jours-iles-mangrove',
    summary: { fr: 'Aventure & grands espaces', en: 'Adventure & wide open spaces' },
    highlights: [
      { fr: 'Campement au bord de l’eau à Mar Lodj', en: 'Waterside camp on Mar Lodj' },
      {
        fr: 'Quad dans la brousse jusqu’aux baobabs',
        en: 'Quad ride through the bush to the baobabs',
      },
      { fr: 'Balade à cheval sur la plage', en: 'Horse ride on the beach' },
      { fr: 'Matinée à l’île aux Oiseaux', en: 'Morning on Bird Island' },
    ],
  },
  {
    slug: 'semaine-immersion-sine-saloum',
    summary: { fr: 'Culture & rencontres', en: 'Culture & encounters' },
    highlights: [
      { fr: 'Écolodge au cœur des îles', en: 'Eco-lodge in the heart of the islands' },
      {
        fr: 'Journée au village avec un guide sérère',
        en: 'A day in the village with a Serer guide',
      },
      { fr: 'Repas et thé chez l’habitant', en: 'Meals and tea with a local family' },
      { fr: 'Île aux coquillages de Joal-Fadiouth', en: 'The shell island of Joal-Fadiouth' },
    ],
  },
];

const destinations: Record<string, Bi> = {
  Ndangane: {
    fr: 'Le village-quai : villas, restaurants au bord du fleuve, départ des pirogues.',
    en: 'The waterfront village: villas, riverside restaurants, where the pirogues leave.',
  },
  'Mar Lodj': {
    fr: 'Île sans voitures, en face de Ndangane : villages, rizières et campements calmes.',
    en: 'A car-free island facing Ndangane: villages, rice fields and quiet camps.',
  },
  'Île aux Oiseaux': {
    fr: 'Pélicans, flamants et sternes royales au fil des saisons, à observer depuis la pirogue.',
    en: 'Pelicans, flamingos and royal terns through the seasons, watched from the pirogue.',
  },
  'Joal-Fadiouth': {
    fr: 'L’île aux coquillages et son cimetière mixte, reliée par un pont de bois.',
    en: 'The shell island and its shared cemetery, linked by a wooden bridge.',
  },
  Palmarin: {
    fr: 'Plages sauvages, lagunes et rôniers, idéal pour le cheval au lever du jour.',
    en: 'Wild beaches, lagoons and palm trees, perfect for riding at sunrise.',
  },
  Djiffer: {
    fr: 'Village de pêcheurs au bout de la pointe de Sangomar, entre océan et fleuve.',
    en: 'A fishing village at the tip of the Sangomar spit, between ocean and river.',
  },
};

const universes: Record<string, Bi> = {
  'mangrove-et-iles': {
    fr: 'Pirogue traditionnelle dans les bolongs, île aux Oiseaux, pêche au gros ou à la palangrotte.',
    en: 'Traditional pirogue through the bolongs, Bird Island, deep-sea or hand-line fishing.',
  },
  'terre-et-villages': {
    fr: 'Quad dans la brousse, cheval sur la plage, randonnées vers les villages sérères avec un guide du coin.',
    en: 'Quad rides in the bush, horses on the beach, walks to Serer villages with a local guide.',
  },
  'table-du-saloum': {
    fr: 'Huîtres de palétuviers, thiof grillé, repas chez l’habitant et meilleures tables de Ndangane.',
    en: 'Mangrove oysters, grilled thiof, meals with local families and the best tables in Ndangane.',
  },
  'sejours-et-hebergements': {
    fr: 'Villas privées avec piscine, écolodges et campements les pieds dans l’eau, tous visités par notre équipe.',
    en: 'Private villas with pools, eco-lodges and waterside camps, all visited by our team.',
  },
};

const chapters: Bi[] = [
  { fr: 'Le lever sur le bolong', en: 'Sunrise on the bolong' },
  { fr: 'L’île aux Oiseaux', en: 'Bird Island' },
  { fr: 'La pêche du matin', en: 'The morning catch' },
  { fr: 'Le soir au village', en: 'Evening in the village' },
];

/** Vidéos verticales : affiche = photo fournie (nom de fichier du seed), flux public Mux. */
const reels: { title: Bi; poster: string }[] = [
  { title: { fr: 'Quad vers les baobabs', en: 'Quad ride to the baobabs' }, poster: 'quad-yard' },
  { title: { fr: 'Galop au lever du jour', en: 'Gallop at sunrise' }, poster: 'horse-ride' },
  { title: { fr: 'Le soir sur le bolong', en: 'Evening on the bolong' }, poster: 'sunset' },
  { title: { fr: 'Réveil à la villa', en: 'Waking up at the villa' }, poster: 'villa-pool' },
];
/** Paragraphe Lexical unique (transcription descriptive des vidéos verticales). */
const paragraph = (text: string) => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: [
      {
        type: 'paragraph',
        format: '' as const,
        indent: 0,
        version: 1,
        direction: 'ltr' as const,
        textFormat: 0,
        children: [
          { type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 },
        ],
      },
    ],
  },
});

const DEMO_PLAYBACK_ID = 'a4nOgmxGWg6gULfcBbAa00gXyfcwPnAFldF8RdsNyk8M';

const updateStays = async (payload: Payload): Promise<void> => {
  for (const stay of stays) {
    const found = await payload.find({
      collection: 'stays',
      locale: 'fr',
      where: { 'seo.slug': { equals: stay.slug } },
      limit: 1,
      depth: 0,
    });
    const [doc] = found.docs;
    if (!doc) {
      payload.logger.warn(`Séjour introuvable : ${stay.slug}`);
      continue;
    }
    const updated = await payload.update({
      collection: 'stays',
      id: doc.id,
      locale: 'fr',
      context,
      data: {
        summary: stay.summary.fr,
        featured: true,
        included: stay.highlights.map((item) => ({ item: item.fr })),
      },
    });
    await payload.update({
      collection: 'stays',
      id: doc.id,
      locale: 'en',
      context,
      data: {
        summary: stay.summary.en,
        included: (updated.included ?? []).map((row, index) => ({
          id: row.id,
          item: stay.highlights[index]?.en ?? row.item,
        })),
      },
    });
  }
};

const updateIntros = async (payload: Payload): Promise<void> => {
  const allDestinations = await payload.find({
    collection: 'destinations',
    locale: 'fr',
    limit: 50,
    depth: 0,
  });
  for (const doc of allDestinations.docs) {
    const intro = destinations[doc.name ?? ''];
    if (!intro) continue;
    for (const locale of ['fr', 'en'] as const) {
      await payload.update({
        collection: 'destinations',
        id: doc.id,
        locale,
        context,
        data: { intro: intro[locale] },
      });
    }
  }
  const allUniverses = await payload.find({
    collection: 'universes',
    locale: 'fr',
    limit: 50,
    depth: 0,
  });
  for (const doc of allUniverses.docs) {
    const intro = universes[doc.seo?.slug ?? ''];
    if (!intro) continue;
    for (const locale of ['fr', 'en'] as const) {
      await payload.update({
        collection: 'universes',
        id: doc.id,
        locale,
        context,
        data: { intro: intro[locale] },
      });
    }
  }
};

const updateFilm = async (payload: Payload): Promise<void> => {
  const films = await payload.find({
    collection: 'videos',
    locale: 'fr',
    where: { format: { equals: 'film' } },
    limit: 1,
    depth: 0,
  });
  const [film] = films.docs;
  if (!film) return;
  for (const locale of ['fr', 'en'] as const) {
    await payload.update({
      collection: 'videos',
      id: film.id,
      locale,
      context,
      data: {
        chapters: (film.chapters ?? []).map((chapter, index) => ({
          id: chapter.id,
          startSeconds: chapter.startSeconds,
          title: chapters[index]?.[locale] ?? chapter.title,
        })),
      },
    });
  }
};

const createReels = async (payload: Payload): Promise<void> => {
  const existing = await payload.count({
    collection: 'videos',
    where: { format: { equals: 'vertical15' } },
  });
  if (existing.totalDocs > 0) return;
  for (const [index, reel] of reels.entries()) {
    const media = await payload.find({
      collection: 'media',
      where: { filename: { like: reel.poster } },
      limit: 1,
      depth: 0,
    });
    const [poster] = media.docs;
    if (!poster) {
      payload.logger.warn(`Affiche introuvable : ${reel.poster}`);
      continue;
    }
    const doc = await payload.create({
      collection: 'videos',
      locale: 'fr',
      context,
      data: {
        _status: 'published',
        title: reel.title.fr,
        description: `${reel.title.fr} (vidéo verticale de démonstration).`,
        format: 'vertical15',
        muxPlaybackId: DEMO_PLAYBACK_ID,
        durationSeconds: 15,
        poster: poster.id,
        captions: [
          { locale: 'fr', url: '/videos/film-demo.fr.vtt' },
          { locale: 'en', url: '/videos/film-demo.en.vtt' },
        ],
        uploadDate: `2026-11-0${index + 2}T09:00:00.000Z`,
        descriptiveTranscript: paragraph(
          `Transcription descriptive de démonstration : ${reel.title.fr.toLowerCase()}, quinze secondes sans paroles.`,
        ),
        provenance: {
          author: 'Démonstration (flux public Mux)',
          place: 'Non applicable',
          date: '2026-11-21',
        },
      },
    });
    await payload.update({
      collection: 'videos',
      id: doc.id,
      locale: 'en',
      context,
      data: {
        title: reel.title.en,
        description: `${reel.title.en} (demonstration vertical video).`,
        descriptiveTranscript: paragraph(
          `Demonstration descriptive transcript: ${reel.title.en.toLowerCase()}, fifteen seconds without speech.`,
        ),
      },
    });
  }
};

/** Expériences de la maquette « Composer mon séjour » absentes du seed. */
const demoExperiences: {
  title: Bi;
  summary: Bi;
  slug: Bi;
  universe: string;
  destination: string;
  price: number;
  minutes: number;
  level: 'facile' | 'modere' | 'sportif';
  kind: 'activity' | 'table';
  partner: 'guide' | 'restaurant';
  slots: { label: string; startTime: string }[];
  meetingPoint: Bi;
  photos: string[];
}[] = [
  {
    title: { fr: 'Île aux Oiseaux en pirogue', en: 'Bird Island by pirogue' },
    summary: {
      fr: 'Demi-journée en pirogue jusqu’aux colonies de pélicans, sternes et flamants ; jumelles fournies.',
      en: 'Half a day by pirogue to the colonies of pelicans, terns and flamingos; binoculars provided.',
    },
    slug: { fr: 'ile-aux-oiseaux-pirogue', en: 'bird-island-pirogue' },
    universe: 'mangrove-et-iles',
    destination: 'Île aux Oiseaux',
    price: 20_000,
    minutes: 240,
    level: 'facile',
    kind: 'activity',
    partner: 'guide',
    slots: [{ label: 'Matin', startTime: '08:30' }],
    meetingPoint: { fr: 'Embarcadère de Ndangane', en: 'Ndangane jetty' },
    photos: ['gull-colony', 'cormorants', 'egret', 'bolong-wide'],
  },
  {
    title: { fr: 'Pêche à la palangrotte', en: 'Hand-line fishing' },
    summary: {
      fr: 'Trois heures en pirogue avec un pêcheur de Ndangane, à la ligne, comme on pêche ici.',
      en: 'Three hours in a pirogue with a Ndangane fisherman, line fishing the local way.',
    },
    slug: { fr: 'peche-palangrotte-ndangane', en: 'hand-line-fishing-ndangane' },
    universe: 'mangrove-et-iles',
    destination: 'Ndangane',
    price: 20_000,
    minutes: 180,
    level: 'facile',
    kind: 'activity',
    partner: 'guide',
    slots: [
      { label: 'Matin', startTime: '07:30' },
      { label: 'Après-midi', startTime: '16:00' },
    ],
    meetingPoint: { fr: 'Embarcadère de Ndangane', en: 'Ndangane jetty' },
    photos: ['boat-trip', 'village-waterfront', 'bolong-channel', 'group-pirogue'],
  },
  {
    title: {
      fr: 'Village sérère et repas chez l’habitant',
      en: 'Serer village and lunch with a local family',
    },
    summary: {
      fr: 'Une journée avec un guide du village : rizières, case à palabres, repas partagé et thé.',
      en: 'A day with a village guide: rice fields, the palaver hut, a shared meal and tea.',
    },
    slug: { fr: 'village-serere-repas-habitant', en: 'serer-village-local-lunch' },
    universe: 'terre-et-villages',
    destination: 'Mar Lodj',
    price: 18_000,
    minutes: 360,
    level: 'facile',
    kind: 'activity',
    partner: 'guide',
    slots: [{ label: 'Journée', startTime: '09:30' }],
    meetingPoint: { fr: 'Débarcadère de Mar Lodj', en: 'Mar Lodj landing' },
    photos: ['village-shore', 'family-meal', 'village-waterfront', 'flag-pirogue'],
  },
  {
    title: { fr: 'Dégustation d’huîtres de palétuviers', en: 'Mangrove oyster tasting' },
    summary: {
      fr: 'Huîtres cueillies sur les racines à marée basse, grillées sur la braise au bord du bolong.',
      en: 'Oysters picked from the roots at low tide, grilled over embers by the bolong.',
    },
    slug: { fr: 'degustation-huitres-paletuviers', en: 'mangrove-oyster-tasting' },
    universe: 'table-du-saloum',
    destination: 'Ndangane',
    price: 12_000,
    minutes: 90,
    level: 'facile',
    kind: 'table',
    partner: 'restaurant',
    slots: [{ label: 'Déjeuner', startTime: '12:30' }],
    meetingPoint: { fr: 'Ponton de Ndangane', en: 'Ndangane pontoon' },
    photos: ['sunset', 'family-meal', 'bolong-pontoons', 'egret'],
  },
];

const createExperiences = async (payload: Payload): Promise<void> => {
  const one = async <T>(promise: Promise<{ docs: T[] }>): Promise<T | undefined> =>
    (await promise).docs[0];
  const policy = await one(
    payload.find({
      collection: 'cancellationPolicies',
      where: { name: { equals: 'Souple (activités et transferts)' } },
      limit: 1,
      depth: 0,
    }),
  );
  const faq = await one(payload.find({ collection: 'faqItems', limit: 1, depth: 0 }));
  if (!policy) {
    payload.logger.warn('Politique « Souple » absente : lancer `pnpm seed:checkout` d’abord.');
    return;
  }
  for (const experience of demoExperiences) {
    const existing = await payload.count({
      collection: 'experiences',
      where: { 'seo.slug': { equals: experience.slug.fr } },
      locale: 'fr',
    });
    if (existing.totalDocs > 0) continue;
    const [universe, destination, partner] = await Promise.all([
      one(
        payload.find({
          collection: 'universes',
          locale: 'fr',
          where: { 'seo.slug': { equals: experience.universe } },
          limit: 1,
          depth: 0,
        }),
      ),
      one(
        payload.find({
          collection: 'destinations',
          locale: 'fr',
          where: { name: { equals: experience.destination } },
          limit: 1,
          depth: 0,
        }),
      ),
      one(
        payload.find({
          collection: 'partners',
          where: { kind: { equals: experience.partner } },
          limit: 1,
          depth: 0,
        }),
      ),
    ]);
    const photos = (
      await Promise.all(
        experience.photos.map((name) =>
          one(
            payload.find({
              collection: 'media',
              where: { filename: { like: name } },
              limit: 1,
              depth: 0,
            }),
          ),
        ),
      )
    ).flatMap((doc) => (doc ? [doc.id] : []));
    const [hero, ...gallery] = photos;
    if (!universe || !destination || !partner || hero === undefined) {
      payload.logger.warn(`Expérience ignorée (données manquantes) : ${experience.slug.fr}`);
      continue;
    }
    const doc = await payload.create({
      collection: 'experiences',
      locale: 'fr',
      context,
      data: {
        _status: 'published',
        title: experience.title.fr,
        summary: experience.summary.fr,
        heroImage: hero,
        gallery,
        universe: universe.id,
        durationMinutes: experience.minutes,
        level: experience.level,
        seasonMonths: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        meetingPoint: experience.meetingPoint.fr,
        pricePerPerson: experience.price,
        maxParticipants: 12,
        offerKind: experience.kind,
        slots: experience.slots,
        childPricePercent: 50,
        destination: destination.id,
        bookable: true,
        partner: partner.id,
        cancellationPolicy: policy.id,
        ...(faq ? { faq: [faq.id] } : {}),
        body: demoBody('fr', `${experience.title.fr}. ${experience.summary.fr}`),
        seo: {
          slug: experience.slug.fr,
          metaTitle: `${experience.title.fr} | Saloum Évasion`.slice(0, 60),
          metaDescription: `${experience.summary.fr} (démonstration)`,
        },
      },
    });
    await payload.update({
      collection: 'experiences',
      id: doc.id,
      locale: 'en',
      context,
      data: {
        _status: 'published',
        title: experience.title.en,
        summary: experience.summary.en,
        meetingPoint: experience.meetingPoint.en,
        body: demoBody('en', `${experience.title.en}. ${experience.summary.en}`),
        seo: {
          slug: experience.slug.en,
          metaTitle: `${experience.title.en} | Saloum Évasion`.slice(0, 60),
          metaDescription: `${experience.summary.en} (demonstration)`,
        },
      },
    });
    payload.logger.info(`Expérience créée : ${experience.slug.fr}`);
  }
};

const seed = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Contenus de présentation interdits en production.');
  }
  const payload = await getPayload({ config });
  await updateStays(payload);
  await updateIntros(payload);
  await updateFilm(payload);
  await createReels(payload);
  await createExperiences(payload);
  payload.logger.info('Contenus de présentation appliqués.');
};

await seed();
process.exit(0);
