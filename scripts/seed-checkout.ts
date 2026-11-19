import config from '@payload-config';
import { getPayload, type Payload } from 'payload';
import { DEFAULT_COMMISSION_RATES } from '@/globals/CommissionRates';
import { richText } from '@/seed/content';

// Données de démonstration du tunnel de vente (002, T036), à lancer après `pnpm seed` :
// prestataires, taux de commission, politiques d'annulation à paliers, un écolodge, trois
// expériences, une table, deux transferts et un séjour signature rendus vendables.
// Idempotent : relancer le script met à jour les mêmes documents. Usage : `pnpm seed:checkout`.

const context = { disableRevalidate: true };

const TABLE_SLUG = 'table-du-saloum-chez-l-habitant';

// Fiches de référence des tests de la 001 (demande de séjour) : jamais rendues vendables ici.
const REQUEST_ONLY_SLUGS = new Set(['week-end-bolong-ndangane', 'excursion-pirogue-bolongs']);

type PartnerKind = 'lodging' | 'guide' | 'restaurant' | 'transport';

const PARTNERS: { key: PartnerKind; name: string; whatsapp: string }[] = [
  { key: 'lodging', name: 'Écolodge des bolongs (démo)', whatsapp: '+221770000101' },
  { key: 'guide', name: 'Guides pirogue de Ndangane (démo)', whatsapp: '+221770000102' },
  { key: 'restaurant', name: 'Table de Mar Lodj (démo)', whatsapp: '+221770000103' },
  { key: 'transport', name: 'Transferts Petite-Côte (démo)', whatsapp: '+221770000104' },
];

const upsertPartner = async (payload: Payload, partner: (typeof PARTNERS)[number]) => {
  const existing = await payload.find({
    collection: 'partners',
    where: { name: { equals: partner.name } },
    limit: 1,
    depth: 0,
  });
  const data = {
    name: partner.name,
    kind: partner.key,
    whatsapp: partner.whatsapp,
    email: `partenaire-${partner.key}@example.sn`,
    payoutMethod: 'wave' as const,
    active: true,
  };
  const [found] = existing.docs;
  return found
    ? payload.update({ collection: 'partners', id: found.id, data, context })
    : payload.create({ collection: 'partners', data, context });
};

const upsertPolicy = async (
  payload: Payload,
  name: string,
  summary: { fr: string; en: string },
  tiers: { daysBeforeArrivalMin: number; refundPercent: number }[],
) => {
  const existing = await payload.find({
    collection: 'cancellationPolicies',
    where: { name: { equals: name } },
    limit: 1,
    depth: 0,
  });
  const [found] = existing.docs;
  const doc = found
    ? await payload.update({
        collection: 'cancellationPolicies',
        id: found.id,
        locale: 'fr',
        data: { tiers, summary: summary.fr },
        context,
      })
    : await payload.create({
        collection: 'cancellationPolicies',
        locale: 'fr',
        data: {
          name,
          summary: summary.fr,
          details: richText([
            'Conditions de démonstration : à remplacer par les conditions réelles.',
          ]),
          tiers,
        },
        context,
      });
  await payload.update({
    collection: 'cancellationPolicies',
    id: doc.id,
    locale: 'en',
    data: {
      summary: summary.en,
      details: richText(['Demonstration terms: to be replaced by the real terms.']),
    },
    context,
  });
  return doc;
};

const run = async (): Promise<void> => {
  const payload = await getPayload({ config });

  const partners = new Map<PartnerKind, number>();
  for (const partner of PARTNERS)
    partners.set(partner.key, (await upsertPartner(payload, partner)).id);
  const partnerId = (key: PartnerKind): number => partners.get(key) ?? 0;

  const rates = await payload.findGlobal({ slug: 'commissionRates', depth: 0 });
  if (!rates.rates || rates.rates.length === 0) {
    await payload.updateGlobal({
      slug: 'commissionRates',
      data: { rates: DEFAULT_COMMISSION_RATES },
      context,
    });
  }

  const standard = await upsertPolicy(
    payload,
    'Standard',
    {
      fr: 'Annulation gratuite jusqu’à 30 jours avant l’arrivée, 50 % ensuite jusqu’à 14 jours.',
      en: 'Free cancellation up to 30 days before arrival, 50% refund up to 14 days.',
    },
    [
      { daysBeforeArrivalMin: 30, refundPercent: 100 },
      { daysBeforeArrivalMin: 14, refundPercent: 50 },
      { daysBeforeArrivalMin: 0, refundPercent: 0 },
    ],
  );
  const flexible = await upsertPolicy(
    payload,
    'Souple (activités et transferts)',
    {
      fr: 'Annulation gratuite jusqu’à 48 h avant, 50 % jusqu’à la veille.',
      en: 'Free cancellation up to 48 hours before, 50% refund until the day before.',
    },
    [
      { daysBeforeArrivalMin: 2, refundPercent: 100 },
      { daysBeforeArrivalMin: 1, refundPercent: 50 },
      { daysBeforeArrivalMin: 0, refundPercent: 0 },
    ],
  );

  // Écolodge : le premier hébergement de type écolodge (sinon le premier).
  const accommodations = await payload.find({
    collection: 'accommodations',
    limit: 10,
    depth: 0,
    sort: 'id',
  });
  const lodge =
    accommodations.docs.find((doc) => doc.type === 'ecolodge') ?? accommodations.docs[0];
  if (lodge) {
    await payload.update({
      collection: 'accommodations',
      id: lodge.id,
      locale: 'fr',
      data: {
        _status: 'published',
        bookable: true,
        partner: partnerId('lodging'),
        cancellationPolicy: standard.id,
        minNights: 2,
      },
      context,
    });
  }

  // Expériences : trois activités et la table du Saloum.
  const experiences = await payload.find({
    collection: 'experiences',
    locale: 'fr',
    limit: 20,
    depth: 0,
    sort: 'id',
  });
  const table = experiences.docs.find((doc) => doc.seo?.slug === TABLE_SLUG);
  const activities = experiences.docs
    .filter((doc) => doc.id !== table?.id && !REQUEST_ONLY_SLUGS.has(doc.seo?.slug ?? ''))
    .slice(0, 3);
  // Remet en « demande seulement » les fiches de référence (relance du script sur une base ancienne).
  for (const doc of experiences.docs.filter((candidate) =>
    REQUEST_ONLY_SLUGS.has(candidate.seo?.slug ?? ''),
  )) {
    await payload.update({
      collection: 'experiences',
      id: doc.id,
      locale: 'fr',
      data: { bookable: false },
      context,
    });
  }
  for (const experience of activities) {
    await payload.update({
      collection: 'experiences',
      id: experience.id,
      locale: 'fr',
      data: {
        _status: 'published',
        bookable: true,
        offerKind: 'activity',
        partner: partnerId('guide'),
        cancellationPolicy: flexible.id,
        childPricePercent: 50,
        slots: [
          { label: 'Matin', startTime: '09:00' },
          { label: 'Coucher du soleil', startTime: '17:30' },
        ],
      },
      context,
    });
  }
  if (table) {
    await payload.update({
      collection: 'experiences',
      id: table.id,
      locale: 'fr',
      data: {
        _status: 'published',
        bookable: true,
        offerKind: 'table',
        partner: partnerId('restaurant'),
        cancellationPolicy: flexible.id,
        childPricePercent: 50,
        slots: [{ label: 'Dîner', startTime: '19:30' }],
      },
      context,
    });
  }

  // Séjour signature : le premier séjour qui n'est pas une fiche de référence de la 001.
  const stays = await payload.find({
    collection: 'stays',
    limit: 10,
    depth: 0,
    sort: 'id',
    locale: 'fr',
  });
  for (const doc of stays.docs.filter((candidate) =>
    REQUEST_ONLY_SLUGS.has(candidate.seo?.slug ?? ''),
  )) {
    await payload.update({
      collection: 'stays',
      id: doc.id,
      locale: 'fr',
      data: { bookable: false },
      context,
    });
  }
  const stay = stays.docs.find((candidate) => !REQUEST_ONLY_SLUGS.has(candidate.seo?.slug ?? ''));
  if (stay) {
    await payload.update({
      collection: 'stays',
      id: stay.id,
      locale: 'fr',
      data: {
        _status: 'published',
        bookable: true,
        partner: partnerId('lodging'),
        childPricePercent: 50,
        requireFullPayment: false,
      },
      context,
    });
  }

  // Transferts AIBD et Dakar vers la première destination.
  const destinations = await payload.find({
    collection: 'destinations',
    limit: 1,
    depth: 0,
    sort: 'id',
  });
  const [destination] = destinations.docs;
  const transfers = [
    {
      title: { fr: 'Aéroport AIBD → Sine-Saloum', en: 'AIBD airport → Sine-Saloum' },
      origin: 'aibd' as const,
      durationMinutes: 150,
      priceTiers: [
        { maxPassengers: 3, pricePerVehicle: 45_000 },
        { maxPassengers: 7, pricePerVehicle: 70_000 },
        { maxPassengers: 14, pricePerVehicle: 110_000 },
      ],
    },
    {
      title: { fr: 'Dakar → Sine-Saloum', en: 'Dakar → Sine-Saloum' },
      origin: 'dakar' as const,
      durationMinutes: 180,
      priceTiers: [
        { maxPassengers: 3, pricePerVehicle: 55_000 },
        { maxPassengers: 7, pricePerVehicle: 80_000 },
        { maxPassengers: 14, pricePerVehicle: 125_000 },
      ],
    },
  ];
  if (destination) {
    for (const transfer of transfers) {
      const existing = await payload.find({
        collection: 'transfers',
        where: { origin: { equals: transfer.origin } },
        limit: 1,
        depth: 0,
      });
      const data = {
        title: transfer.title.fr,
        origin: transfer.origin,
        destination: destination.id,
        durationMinutes: transfer.durationMinutes,
        priceTiers: transfer.priceTiers,
        bookable: true,
        partner: partnerId('transport'),
        cancellationPolicy: flexible.id,
      };
      const [found] = existing.docs;
      const doc = found
        ? await payload.update({
            collection: 'transfers',
            id: found.id,
            locale: 'fr',
            data,
            context,
          })
        : await payload.create({ collection: 'transfers', locale: 'fr', data, context });
      await payload.update({
        collection: 'transfers',
        id: doc.id,
        locale: 'en',
        data: { title: transfer.title.en },
        context,
      });
    }
  }

  // Panier de démonstration de Lighthouse CI (cookie `se_cart=LhciDemoCartToken00000`, lighthouserc.json) :
  // une expérience à 60 jours, pour mesurer le panier et l'étape coordonnées.
  const demoActivity = activities[0];
  if (demoActivity) {
    const start = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const tokenHash = '38cb3de8855c89dd9dd2a97fc7c49a0aa0c2adf44bebd0d84a2b63f12cf14fb5';
    const existingCart = await payload.find({
      collection: 'carts',
      where: { tokenHash: { equals: tokenHash } },
      limit: 1,
      depth: 0,
    });
    const cartData = {
      tokenHash,
      locale: 'fr' as const,
      status: 'open' as const,
      version: 1,
      remindersSent: 0,
      remindersConsent: false,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        {
          lineId: 'lhcidemoline01',
          offerType: 'experience' as const,
          offer: { relationTo: 'experiences' as const, value: demoActivity.id },
          startDate: start,
          slot: '09:00',
          adults: 2,
          children: 0,
          infants: 0,
          quotedUnitPrice: demoActivity.pricePerPerson,
          quotedTotal: demoActivity.pricePerPerson * 2,
        },
      ],
    };
    const [demoCart] = existingCart.docs;
    if (demoCart)
      await payload.update({ collection: 'carts', id: demoCart.id, data: cartData, context });
    else await payload.create({ collection: 'carts', data: cartData, context });
  }

  payload.logger.info(
    `Seed tunnel terminé : ${PARTNERS.length} prestataires, écolodge ${lodge ? 'vendable' : 'absent'}, ${activities.length} expériences, table ${table ? 'vendable' : 'absente'}, ${destination ? transfers.length : 0} transferts, séjour ${stay ? 'vendable' : 'absent'}.`,
  );
  process.exit(0);
};

await run();
