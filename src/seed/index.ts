// Jeu de données de DÉMONSTRATION (tâche T062) : `pnpm seed`.
// Réservé au développement et aux tests : refuse de s'exécuter en production, ne crée rien
// si des séjours existent déjà (sauf SEED_RESET=1, qui vide d'abord les collections).
// Images : visuels de remplacement générés et marqués « démonstration », jamais présentés
// comme de vraies photos (constitution V) ; provenance « Démonstration ».
import config from '@payload-config';
import { getPayload, type Payload } from 'payload';
import sharp from 'sharp';
import { PAGE_KEYS, type PageKey } from '@/collections/Pages';
import { demoBody, destinations, richText, universes, type Bilingual } from './content';

const context = { disableRevalidate: true };

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@saloum-evasion.test';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'demo-admin-password';

const SEEDED_COLLECTIONS = [
  'stays',
  'experiences',
  'accommodations',
  'destinations',
  'universes',
  'pages',
  'faqItems',
  'cancellationPolicies',
  'media',
] as const;

const palette = ['#0f2a24', '#1b3d35', '#9e4521', '#7d3519', '#4a5a55', '#7a6f5f'];

const demoImage = async (index: number, label: string): Promise<Buffer> => {
  const background = palette[index % palette.length] ?? '#0f2a24';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000">
    <rect width="100%" height="100%" fill="${background}"/>
    <text x="80" y="860" font-family="sans-serif" font-size="56" fill="#f4eee3">IMAGE DE DÉMONSTRATION</text>
    <text x="80" y="930" font-family="sans-serif" font-size="40" fill="#f4eee3">${label}</text>
  </svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 70 }).toBuffer();
};

const createMedia = async (payload: Payload, count: number): Promise<number[]> => {
  const ids: number[] = [];
  for (let index = 0; index < count; index += 1) {
    const label = `Visuel ${index + 1}`;
    const data = await demoImage(index, label);
    const doc = await payload.create({
      collection: 'media',
      context,
      data: {
        alt: {
          fr: `Image de démonstration ${index + 1} (à remplacer par une vraie photo)`,
          en: `Demonstration image ${index + 1} (to be replaced by a real photo)`,
        },
        provenance: { author: 'Démonstration', place: 'Générée', date: '2026-11-14' },
      },
      file: { data, mimetype: 'image/jpeg', name: `demo-${index + 1}.jpg`, size: data.length },
    });
    ids.push(doc.id);
  }
  return ids;
};

const pick = (ids: number[], start: number, count: number): number[] =>
  Array.from({ length: count }, (_, offset) => ids[(start + offset) % ids.length] ?? ids[0] ?? 0);

const seo = (title: Bilingual, description: Bilingual, slug?: Bilingual) => ({
  fr: { metaTitle: title.fr, metaDescription: description.fr, ...(slug ? { slug: slug.fr } : {}) },
  en: { metaTitle: title.en, metaDescription: description.en, ...(slug ? { slug: slug.en } : {}) },
});

const reset = async (payload: Payload): Promise<void> => {
  for (const collection of SEEDED_COLLECTIONS) {
    await payload.delete({ collection, where: { id: { exists: true } }, context });
  }
};

const ensureAdmin = async (payload: Payload): Promise<void> => {
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: ADMIN_EMAIL } },
    limit: 1,
  });
  if (existing.docs.length > 0) return;
  await payload.create({
    collection: 'users',
    context,
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, name: 'Admin démo', role: 'admin' },
  });
};

const seed = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'production' && process.env.SEED_ALLOW_PRODUCTION !== '1') {
    throw new Error('Seed de démonstration interdit en production.');
  }
  const payload = await getPayload({ config });
  await ensureAdmin(payload);

  if (process.env.SEED_RESET === '1') await reset(payload);

  // Numéro WhatsApp FICTIF de démonstration (barre d'action et tests) ; jamais en production
  // (seed refusé), remplaçable par SEED_WHATSAPP_NUMBER. Le vrai numéro se saisit dans
  // « Réglages du site ».
  const current = await payload.findGlobal({ slug: 'siteSettings', depth: 0 });
  if (!current.whatsappNumber) {
    await payload.updateGlobal({
      slug: 'siteSettings',
      context,
      data: { whatsappNumber: process.env.SEED_WHATSAPP_NUMBER ?? '+221700000000' },
    });
  }

  const existing = await payload.count({ collection: 'stays' });
  if (existing.totalDocs > 0) {
    payload.logger.info(
      'Des séjours existent déjà : seed ignoré (SEED_RESET=1 pour repartir de zéro).',
    );
    return;
  }

  const media = await createMedia(payload, 12);

  // --- Réglages du site (aucune coordonnée inventée : téléphone et e-mail laissés vides).
  await payload.updateGlobal({
    slug: 'siteSettings',
    context,
    locale: 'fr',
    data: {
      brandName: 'Saloum Évasion',
      address: { locality: 'Ndangane', region: 'Fatick', country: 'SN' },
      responseTimeText: 'Réponse sous 24 h, souvent dans l’heure',
      highSeasons: [{ from: '11-01', to: '04-30' }],
      guarantees: [
        {
          icon: 'local',
          title: 'Organisé par des gens d’ici',
          text: 'Une équipe basée à Ndangane.',
        },
        {
          icon: 'clear',
          title: 'Conditions claires',
          text: 'Annulation affichée avant toute réservation.',
        },
      ],
    },
  });
  const settings = await payload.findGlobal({ slug: 'siteSettings', locale: 'fr', depth: 0 });
  await payload.updateGlobal({
    slug: 'siteSettings',
    context,
    locale: 'en',
    data: {
      responseTimeText: 'Reply within 24 hours, often within the hour',
      guarantees: (settings.guarantees ?? []).map((guarantee, index) => ({
        id: guarantee.id,
        title: ['Organised by local people', 'Clear terms'][index] ?? guarantee.title,
        text: ['A team based in Ndangane.', 'Cancellation shown before any booking.'][index] ?? '',
      })),
    },
  });

  // --- Conditions d'annulation et FAQ.
  const policy = await payload.create({
    collection: 'cancellationPolicies',
    context,
    locale: 'fr',
    data: {
      name: 'Standard',
      summary:
        'Annulation gratuite jusqu’à 30 jours avant l’arrivée, 50 % ensuite jusqu’à 14 jours.',
      details: richText(['Conditions de démonstration : à remplacer par les conditions réelles.']),
    },
  });
  await payload.update({
    collection: 'cancellationPolicies',
    id: policy.id,
    context,
    locale: 'en',
    data: {
      summary: 'Free cancellation up to 30 days before arrival, 50% refund up to 14 days.',
      details: richText(['Demonstration terms: to be replaced by the real terms.']),
    },
  });

  const faqIds: number[] = [];
  for (const [index, entry] of [
    { fr: 'Comment réserver un séjour ?', en: 'How do I book a stay?' },
    { fr: 'Quels moyens de paiement acceptez-vous ?', en: 'Which payment methods do you accept?' },
    {
      fr: 'Organisez-vous le transfert depuis Dakar ?',
      en: 'Do you arrange transfers from Dakar?',
    },
  ].entries()) {
    const faq = await payload.create({
      collection: 'faqItems',
      context,
      locale: 'fr',
      data: {
        question: entry.fr,
        answer: richText(['Réponse de démonstration.']),
        order: index,
        category: 'general',
      },
    });
    await payload.update({
      collection: 'faqItems',
      id: faq.id,
      context,
      locale: 'en',
      data: { question: entry.en, answer: richText(['Demonstration answer.']) },
    });
    faqIds.push(faq.id);
  }

  // --- Destinations.
  const destinationIds = new Map<string, number>();
  for (const [index, destination] of destinations.entries()) {
    const meta = seo(
      {
        fr: `${destination.name.fr} : séjour et visite | Saloum Évasion`,
        en: `${destination.name.en}: stay and visit | Saloum Évasion`,
      },
      {
        fr: `Découvrir ${destination.name.fr} dans le Sine-Saloum (contenu de démonstration).`,
        en: `Discover ${destination.name.en} in the Sine-Saloum (demonstration content).`,
      },
    );
    const doc = await payload.create({
      collection: 'destinations',
      context,
      locale: 'fr',
      data: {
        _status: 'published',
        name: destination.name.fr,
        kind: destination.kind,
        heroImage: media[index % media.length] ?? media[0] ?? 0,
        gallery: pick(media, index, 3),
        intro: `${destination.name.fr}, une destination du delta du Saloum (texte de démonstration).`,
        geo: { latitude: destination.lat, longitude: destination.lng },
        body: demoBody('fr', `${destination.name.fr} vous attend.`),
        seo: meta.fr,
      },
    });
    await payload.update({
      collection: 'destinations',
      id: doc.id,
      context,
      locale: 'en',
      data: {
        _status: 'published',
        name: destination.name.en,
        intro: `${destination.name.en}, a destination in the Saloum delta (demonstration text).`,
        body: demoBody('en', `${destination.name.en} is waiting for you.`),
        seo: {
          ...meta.en,
          slug: destination.key === 'ile-aux-oiseaux' ? 'bird-island' : destination.key,
        },
      },
    });
    destinationIds.set(destination.key, doc.id);
  }
  const destinationId = (key: string): number => destinationIds.get(key) ?? 0;

  // --- Univers.
  const universeIds = new Map<string, number>();
  for (const [index, universe] of universes.entries()) {
    const isExperience = universe.kind === 'experience';
    const meta = seo(
      {
        fr: `${universe.name.fr} au Sine-Saloum | Saloum Évasion`,
        en: `${universe.name.en} in Sine-Saloum | Saloum Évasion`,
      },
      {
        fr: `Expériences « ${universe.name.fr} » dans le Sine-Saloum (démonstration).`,
        en: `“${universe.name.en}” experiences in the Sine-Saloum (demonstration).`,
      },
      universe.slug,
    );
    const doc = await payload.create({
      collection: 'universes',
      context,
      locale: 'fr',
      data: {
        _status: 'published',
        name: universe.name.fr,
        kind: universe.kind,
        image: media[index] ?? media[0] ?? 0,
        intro: `${universe.name.fr} : texte d’introduction de démonstration.`,
        order: index,
        ...(isExperience ? { seo: meta.fr } : {}),
      },
    });
    await payload.update({
      collection: 'universes',
      id: doc.id,
      context,
      locale: 'en',
      data: {
        _status: 'published',
        name: universe.name.en,
        intro: `${universe.name.en}: demonstration introduction text.`,
        ...(isExperience ? { seo: meta.en } : {}),
      },
    });
    universeIds.set(universe.key, doc.id);
  }
  const universeId = (key: string): number => universeIds.get(key) ?? 0;

  // --- Expériences.
  const experienceIds: number[] = [];
  const experiences = [
    {
      title: {
        fr: 'Excursion en pirogue dans les bolongs',
        en: 'Pirogue trip through the bolongs',
      },
      slug: { fr: 'excursion-pirogue-bolongs', en: 'pirogue-trip-bolongs' },
      universe: 'mangrove',
      destination: 'ndangane',
      price: 15_000,
      minutes: 180,
      level: 'facile' as const,
    },
    {
      title: { fr: 'Randonnée en quad dans le Sine-Saloum', en: 'Quad bike ride in Sine-Saloum' },
      slug: { fr: 'quad-sine-saloum', en: 'quad-sine-saloum' },
      universe: 'terre',
      destination: 'ndangane',
      price: 35_000,
      minutes: 120,
      level: 'modere' as const,
    },
    {
      title: { fr: 'Balade à cheval à Palmarin', en: 'Horse ride in Palmarin' },
      slug: { fr: 'balade-cheval-palmarin', en: 'horse-ride-palmarin' },
      universe: 'terre',
      destination: 'palmarin',
      price: 25_000,
      minutes: 90,
      level: 'facile' as const,
    },
    {
      title: { fr: 'Table du Saloum chez l’habitant', en: 'Saloum table with a local family' },
      slug: { fr: 'table-du-saloum-chez-l-habitant', en: 'saloum-table-local-family' },
      universe: 'table',
      destination: 'mar-lodj',
      price: 12_000,
      minutes: 150,
      level: 'facile' as const,
    },
  ];
  for (const [index, experience] of experiences.entries()) {
    const meta = seo(
      {
        fr: `${experience.title.fr} | Saloum Évasion`.slice(0, 60),
        en: `${experience.title.en} | Saloum Évasion`.slice(0, 60),
      },
      {
        fr: `${experience.title.fr} : durée, prix et départ (démonstration).`,
        en: `${experience.title.en}: duration, price and meeting point (demo).`,
      },
      experience.slug,
    );
    const doc = await payload.create({
      collection: 'experiences',
      context,
      locale: 'fr',
      data: {
        _status: 'published',
        title: experience.title.fr,
        summary: `${experience.title.fr} (résumé de démonstration).`,
        heroImage: media[(index + 3) % media.length] ?? media[0] ?? 0,
        gallery: pick(media, index + 4, 3),
        universe: universeId(experience.universe),
        durationMinutes: experience.minutes,
        level: experience.level,
        seasonMonths: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        meetingPoint: 'Embarcadère de Ndangane',
        pricePerPerson: experience.price,
        destination: destinationId(experience.destination),
        faq: faqIds.slice(0, 1),
        body: demoBody('fr', experience.title.fr),
        seo: meta.fr,
      },
    });
    await payload.update({
      collection: 'experiences',
      id: doc.id,
      context,
      locale: 'en',
      data: {
        _status: 'published',
        title: experience.title.en,
        summary: `${experience.title.en} (demonstration summary).`,
        meetingPoint: 'Ndangane jetty',
        body: demoBody('en', experience.title.en),
        seo: meta.en,
      },
    });
    experienceIds.push(doc.id);
  }

  // --- Hébergements.
  const accommodationIds: number[] = [];
  const accommodations = [
    {
      title: { fr: 'Villa avec piscine à Ndangane', en: 'Villa with pool in Ndangane' },
      slug: { fr: 'villa-piscine-ndangane', en: 'ndangane-villa-with-pool' },
      type: 'villa' as const,
      capacity: 8,
      price: 120_000,
      destination: 'ndangane',
      amenities: ['piscine', 'wifi', 'vue-bolong'] as const,
    },
    {
      title: { fr: 'Écolodge des bolongs', en: 'Bolong eco-lodge' },
      slug: { fr: 'ecolodge-des-bolongs', en: 'bolong-eco-lodge' },
      type: 'ecolodge' as const,
      capacity: 4,
      price: 45_000,
      destination: 'mar-lodj',
      amenities: ['vue-bolong'] as const,
    },
    {
      title: { fr: 'Campement de Palmarin', en: 'Palmarin camp' },
      slug: { fr: 'campement-de-palmarin', en: 'palmarin-camp' },
      type: 'campement' as const,
      capacity: 2,
      price: 25_000,
      destination: 'palmarin',
      amenities: ['acces-plage'] as const,
    },
  ];
  for (const [index, accommodation] of accommodations.entries()) {
    const meta = seo(
      {
        fr: `${accommodation.title.fr} | Saloum Évasion`,
        en: `${accommodation.title.en} | Saloum Évasion`,
      },
      {
        fr: `${accommodation.title.fr} : capacité, équipements et prix (démonstration).`,
        en: `${accommodation.title.en}: capacity, amenities and price (demonstration).`,
      },
      accommodation.slug,
    );
    const destination = destinations.find(
      (candidate) => candidate.key === accommodation.destination,
    );
    const doc = await payload.create({
      collection: 'accommodations',
      context,
      locale: 'fr',
      data: {
        _status: 'published',
        title: accommodation.title.fr,
        summary: `${accommodation.title.fr} (résumé de démonstration).`,
        heroImage: media[(index + 6) % media.length] ?? media[0] ?? 0,
        gallery: pick(media, index + 2, 5),
        type: accommodation.type,
        capacity: accommodation.capacity,
        amenities: [...accommodation.amenities],
        priceFromPerNight: accommodation.price,
        destination: destinationId(accommodation.destination),
        geo: { latitude: destination?.lat ?? 14.1, longitude: destination?.lng ?? -16.76 },
        address: destination?.name.fr ?? 'Ndangane',
        body: demoBody('fr', accommodation.title.fr),
        seo: meta.fr,
      },
    });
    await payload.update({
      collection: 'accommodations',
      id: doc.id,
      context,
      locale: 'en',
      data: {
        _status: 'published',
        title: accommodation.title.en,
        summary: `${accommodation.title.en} (demonstration summary).`,
        address: destination?.name.en ?? 'Ndangane',
        body: demoBody('en', accommodation.title.en),
        seo: meta.en,
      },
    });
    accommodationIds.push(doc.id);
  }

  // --- Séjours signature.
  const stays = [
    {
      title: { fr: 'Week-end bolong à Ndangane', en: 'Bolong weekend in Ndangane' },
      slug: { fr: 'week-end-bolong-ndangane', en: 'bolong-weekend-ndangane' },
      nights: 2,
      low: 180_000,
      high: 220_000,
      destinations: ['ndangane'],
      featured: true,
    },
    {
      title: { fr: 'Trois jours entre îles et mangrove', en: 'Three days of islands and mangrove' },
      slug: { fr: 'trois-jours-iles-mangrove', en: 'three-days-islands-mangrove' },
      nights: 3,
      low: 320_000,
      high: 380_000,
      destinations: ['mar-lodj', 'ile-aux-oiseaux'],
      featured: true,
    },
    {
      title: { fr: 'Semaine immersion au Sine-Saloum', en: 'Sine-Saloum immersion week' },
      slug: { fr: 'semaine-immersion-sine-saloum', en: 'sine-saloum-immersion-week' },
      nights: 6,
      low: 620_000,
      high: 720_000,
      destinations: ['ndangane', 'palmarin', 'djiffer'],
      featured: false,
    },
  ];
  for (const [index, stay] of stays.entries()) {
    const meta = seo(
      { fr: `${stay.title.fr} | Saloum Évasion`, en: `${stay.title.en} | Saloum Évasion` },
      {
        fr: `${stay.title.fr} : programme, prix et conditions (démonstration).`,
        en: `${stay.title.en}: itinerary, price and terms (demonstration).`,
      },
      stay.slug,
    );
    const doc = await payload.create({
      collection: 'stays',
      context,
      locale: 'fr',
      data: {
        _status: 'published',
        title: stay.title.fr,
        summary: `${stay.title.fr} (résumé de démonstration).`,
        heroImage: media[(index + 9) % media.length] ?? media[0] ?? 0,
        gallery: pick(media, index + 1, 4),
        durationNights: stay.nights,
        moods: ['nature', 'detente'],
        pricing: { lowSeasonPerPerson: stay.low, highSeasonPerPerson: stay.high },
        itinerary: Array.from({ length: stay.nights + 1 }, (_, day) => ({
          day: day + 1,
          title: `Jour ${day + 1}`,
          description: 'Programme de démonstration.',
        })),
        included: [{ item: 'Hébergement' }, { item: 'Repas' }, { item: 'Transfert depuis Dakar' }],
        notIncluded: [{ item: 'Boissons' }],
        cancellationPolicy: policy.id,
        destinations: stay.destinations.map(destinationId),
        accommodations: accommodationIds.slice(0, 1),
        experiences: experienceIds.slice(0, 2),
        faq: faqIds,
        featured: stay.featured,
        body: demoBody('fr', stay.title.fr),
        seo: meta.fr,
      },
    });
    const fr = await payload.findByID({ collection: 'stays', id: doc.id, locale: 'fr', depth: 0 });
    await payload.update({
      collection: 'stays',
      id: doc.id,
      context,
      locale: 'en',
      data: {
        _status: 'published',
        title: stay.title.en,
        summary: `${stay.title.en} (demonstration summary).`,
        itinerary: (fr.itinerary ?? []).map((row) => ({
          ...row,
          title: `Day ${row.day}`,
          description: 'Demonstration itinerary.',
        })),
        included: (fr.included ?? []).map((row, rowIndex) => ({
          ...row,
          item: ['Lodging', 'Meals', 'Transfer from Dakar'][rowIndex] ?? row.item,
        })),
        notIncluded: (fr.notIncluded ?? []).map((row) => ({ ...row, item: 'Drinks' })),
        body: demoBody('en', stay.title.en),
        seo: meta.en,
      },
    });
  }

  // --- Pages éditoriales et pages sans document propre.
  const pageTitles: Record<PageKey, Bilingual> = {
    home: { fr: 'Le Saloum, vécu de l’intérieur', en: 'The Saloum, lived from within' },
    commitment: { fr: 'Notre engagement', en: 'Our commitment' },
    about: { fr: 'À propos', en: 'About us' },
    faq: { fr: 'Questions fréquentes', en: 'Frequently asked questions' },
    contact: { fr: 'Contact', en: 'Contact' },
    legal: { fr: 'Mentions légales', en: 'Legal notice' },
    privacy: { fr: 'Confidentialité', en: 'Privacy' },
    film: { fr: 'Film d’immersion', en: 'Immersion film' },
    stays_list: { fr: 'Séjours signature', en: 'Signature stays' },
    experiences_hub: { fr: 'Que faire au Sine-Saloum', en: 'Things to do in Sine-Saloum' },
    accommodations_list: { fr: 'Hébergements', en: 'Accommodation' },
    destinations_list: { fr: 'Destinations', en: 'Destinations' },
    not_found: { fr: 'Page introuvable', en: 'Page not found' },
  };
  for (const key of PAGE_KEYS) {
    const title = pageTitles[key];
    const meta = seo(
      { fr: `${title.fr} | Saloum Évasion`, en: `${title.en} | Saloum Évasion` },
      {
        fr: `${title.fr} — Saloum Évasion, séjours au Sine-Saloum (démonstration).`,
        en: `${title.en} — Saloum Évasion, Sine-Saloum stays (demonstration).`,
      },
      { fr: key.replaceAll('_', '-'), en: key.replaceAll('_', '-') },
    );
    const doc = await payload.create({
      collection: 'pages',
      context,
      locale: 'fr',
      data: { _status: 'published', key, title: title.fr, seo: meta.fr },
    });
    await payload.update({
      collection: 'pages',
      id: doc.id,
      context,
      locale: 'en',
      data: { _status: 'published', title: title.en, seo: meta.en },
    });
  }

  payload.logger.info(
    `Seed terminé : ${destinations.length} destinations, ${universes.length} univers, ${experiences.length} expériences, ${accommodations.length} hébergements, ${stays.length} séjours, ${PAGE_KEYS.length} pages.`,
  );
};

await seed();
process.exit(0);
