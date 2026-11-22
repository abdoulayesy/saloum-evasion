'use server';

import { randomBytes } from 'node:crypto';
import { redirect } from 'next/navigation';
import type { Payload } from 'payload';
import { isLocale, type Locale } from '@/i18n/routing';
import { checkoutPath } from '@/lib/checkout/paths';
import { validateCart } from '@/lib/checkout/validateCart';
import { getPayloadClient } from '@/lib/cms/queries';
import { readCartToken, writeCartCookies } from './cookies';
import { loadSeasons, loadSellableOffer, priceOfferLine, type SellableOffer } from './offers';
import { cartSummary, createCart, findOpenCart, saveCartItems, type CartItem } from './repository';
import { z } from 'zod';
import { addDays } from '@/lib/checkout/deposit';
import {
  addToCartSchema,
  formEntries,
  lineIdSchema,
  updateTravellersSchema,
  type AddToCartInput,
} from './schema';
import { verifyReminderLinkToken } from './reminderLink';
import { INTRINSIC_ISSUES, lineEndDate, toCartLine, todayInDakar } from './validate';
import { buildPath } from '@/i18n/pathnames';
import { COMPOSE_LIMITS, planComposition, type PlannedLine } from '@/lib/checkout/compose';

// Server Actions du panier (002, T045 ; contrat checkout-actions). Formulaires classiques :
// fonctionnent sans JavaScript (redirection 303). Après un ajout, le visiteur arrive sur le
// panier, qui propose transferts et expériences de la destination (parcours < 3 min, SC-001).

const LODGING_TYPES = new Set(['accommodation', 'stay']);

const localeOf = (formData: FormData): Locale => {
  const value = formData.get('locale');
  return typeof value === 'string' && isLocale(value) ? value : 'fr';
};

const cartUrl = (locale: Locale, params: Record<string, string> = {}): string => {
  const query = new URLSearchParams(params).toString();
  return `${checkoutPath(locale, 'cart')}${query ? `?${query}` : ''}`;
};

const newLineId = (): string => randomBytes(9).toString('hex');

const openOrCreateCart = async (payload: Payload, locale: Locale) => {
  const token = await readCartToken();
  const existing = token ? await findOpenCart(payload, token) : null;
  if (existing && token) return { cart: existing, token };
  return createCart(payload, locale);
};

type Travellers = { adults: number; children: number; infants: number };

const buildItem = (
  offer: SellableOffer,
  input: {
    startDate: string;
    endDate?: string;
    slot?: string;
    direction?: 'outbound' | 'return';
    time?: string;
  },
  travellers: Travellers,
  seasons: Awaited<ReturnType<typeof loadSeasons>>,
): CartItem => {
  const draft: CartItem = {
    lineId: newLineId(),
    offerType: offer.offerType,
    offer: { relationTo: offerCollection(offer), value: offer.doc.id },
    startDate: input.startDate,
    endDate: input.endDate ?? null,
    slot: input.slot ?? null,
    transferDirection: input.direction ?? null,
    transferTime: input.time ?? null,
    ...travellers,
    quotedUnitPrice: 0,
    quotedTotal: 0,
  };
  const price = priceOfferLine(
    offer,
    { startDate: draft.startDate, endDate: lineEndDate(draft, offer) },
    travellers,
    seasons,
  );
  return { ...draft, quotedUnitPrice: price.unitPrice, quotedTotal: price.total };
};

const offerCollection = (offer: SellableOffer) => {
  switch (offer.offerType) {
    case 'accommodation':
      return 'accommodations' as const;
    case 'stay':
      return 'stays' as const;
    case 'experience':
    case 'table':
      return 'experiences' as const;
    case 'transfer':
      return 'transfers' as const;
    default: {
      const unreachable: never = offer;
      return unreachable;
    }
  }
};

/** Lignes créées par un ajout (un aller-retour de transfert = deux lignes). */
const itemsFor = (
  offer: SellableOffer,
  input: AddToCartInput,
  seasons: Awaited<ReturnType<typeof loadSeasons>>,
): CartItem[] | 'invalid_slot' | 'missing_return' => {
  switch (input.offerType) {
    case 'accommodation':
      return [
        buildItem(offer, { startDate: input.startDate, endDate: input.endDate }, input, seasons),
      ];
    case 'stay':
      return [buildItem(offer, { startDate: input.startDate }, input, seasons)];
    case 'experience':
    case 'table': {
      const slots =
        offer.offerType === 'experience' || offer.offerType === 'table'
          ? (offer.doc.slots ?? [])
          : [];
      if (!slots.some((slot) => slot.startTime === input.slot)) return 'invalid_slot';
      return [buildItem(offer, { startDate: input.date, slot: input.slot }, input, seasons)];
    }
    case 'transfer': {
      const passengers: Travellers = { adults: input.passengers, children: 0, infants: 0 };
      const outbound = buildItem(
        offer,
        { startDate: input.outboundDate, direction: 'outbound', time: input.outboundTime },
        passengers,
        seasons,
      );
      if (input.direction === 'outbound') return [outbound];
      if (!input.returnDate || !input.returnTime) return 'missing_return';
      const back = buildItem(
        offer,
        { startDate: input.returnDate, direction: 'return', time: input.returnTime },
        passengers,
        seasons,
      );
      return input.direction === 'return' ? [back] : [outbound, back];
    }
    default: {
      const unreachable: never = input;
      return unreachable;
    }
  }
};

const encodePending = (entries: Record<string, string>): string =>
  Buffer.from(JSON.stringify(entries)).toString('base64url');

export const addToCart = async (formData: FormData): Promise<void> => {
  const locale = localeOf(formData);
  const entries = formEntries(formData);
  const parsed = addToCartSchema.safeParse(entries);
  if (!parsed.success) redirect(cartUrl(locale, { erreur: 'saisie' }));
  const input = parsed.data;

  const payload = await getPayloadClient();
  const offer = await loadSellableOffer(payload, input.offerType, input.offerId, locale);
  if (!offer) redirect(cartUrl(locale, { erreur: 'indisponible' }));

  const seasons = await loadSeasons(payload);
  const created = itemsFor(offer, input, seasons);
  if (created === 'invalid_slot') redirect(cartUrl(locale, { erreur: 'creneau' }));
  if (created === 'missing_return') redirect(cartUrl(locale, { erreur: 'retour' }));

  // Problèmes propres aux nouvelles lignes : refus immédiat avec la cause.
  const today = todayInDakar();
  const intrinsic = validateCart(
    created.map((item) => toCartLine(item, offer)),
    { today },
  ).find((issue) => INTRINSIC_ISSUES.has(issue.code));
  if (intrinsic) redirect(cartUrl(locale, { erreur: intrinsic.code }));

  const { cart, token } = await openOrCreateCart(payload, locale);
  let items = [...(cart.items ?? [])];

  // Un seul hébergement ou séjour : remplacement explicite.
  if (LODGING_TYPES.has(input.offerType)) {
    const existing = items.find((item) => LODGING_TYPES.has(item.offerType));
    const replace = formData.get('replaceLineId');
    if (existing && replace !== existing.lineId) {
      await writeCartCookies(token, cartSummary(cart));
      redirect(cartUrl(locale, { conflit: 'hebergement', attente: encodePending(entries) }));
    }
    if (existing) items = items.filter((item) => item.lineId !== existing.lineId);
  }

  items = [...items, ...created];
  const saved = await saveCartItems(payload, cart, items, locale);
  await writeCartCookies(token, cartSummary(saved));
  redirect(cartUrl(locale, { ajoute: created[0]?.lineId ?? '' }));
};

export const removeCartLine = async (formData: FormData): Promise<void> => {
  const locale = localeOf(formData);
  const lineId = lineIdSchema.safeParse(formData.get('lineId'));
  const payload = await getPayloadClient();
  const token = await readCartToken();
  const cart = token ? await findOpenCart(payload, token) : null;
  if (!cart || !token || !lineId.success) redirect(cartUrl(locale));
  const saved = await saveCartItems(
    payload,
    cart,
    (cart.items ?? []).filter((item) => item.lineId !== lineId.data),
    locale,
  );
  await writeCartCookies(token, cartSummary(saved));
  redirect(cartUrl(locale, { retire: '1' }));
};

export const updateCartLine = async (formData: FormData): Promise<void> => {
  const locale = localeOf(formData);
  const parsed = updateTravellersSchema.safeParse(formEntries(formData));
  const payload = await getPayloadClient();
  const token = await readCartToken();
  const cart = token ? await findOpenCart(payload, token) : null;
  if (!cart || !token || !parsed.success) redirect(cartUrl(locale, { erreur: 'saisie' }));
  const { lineId, ...travellers } = parsed.data;
  const seasons = await loadSeasons(payload);
  const items = await Promise.all(
    (cart.items ?? []).map(async (item) => {
      if (item.lineId !== lineId) return item;
      const offerId = typeof item.offer.value === 'number' ? item.offer.value : item.offer.value.id;
      const offer = await loadSellableOffer(payload, item.offerType, offerId, locale);
      if (!offer) return item;
      const price = priceOfferLine(
        offer,
        { startDate: item.startDate, endDate: lineEndDate(item, offer) },
        travellers,
        seasons,
      );
      return { ...item, ...travellers, quotedUnitPrice: price.unitPrice, quotedTotal: price.total };
    }),
  );
  const saved = await saveCartItems(payload, cart, items, locale);
  await writeCartCookies(token, cartSummary(saved));
  redirect(cartUrl(locale, { modifie: lineId }));
};

// --- Migration de la « demande en cours » 001 (FR-006, T048) ---------------------------------
// Les éléments choisis avant la 002 (gardés dans le navigateur) rejoignent le panier une fois,
// avec les dates et voyageurs de la demande ; seuls les éléments vendables en ligne sont repris.

const migrationSchema = z.object({
  locale: z.enum(['fr', 'en']),
  items: z
    .array(
      z.object({
        kind: z.enum(['stay', 'experience', 'accommodation']),
        slug: z.string().regex(/^[a-z0-9-]{1,120}$/),
      }),
    )
    .max(10),
  arrivalDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  departureDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  adults: z.number().int().min(1).max(30).optional(),
  children: z.number().int().min(0).max(20).optional(),
});

export type RequestMigrationInput = z.infer<typeof migrationSchema>;

const COLLECTION_OF_KIND = {
  stay: 'stays',
  experience: 'experiences',
  accommodation: 'accommodations',
} as const;

/** Reprend la demande en cours dans le panier ; renvoie le nombre d'éléments ajoutés. */
export const migrateRequestDraft = async (raw: RequestMigrationInput): Promise<number> => {
  const parsed = migrationSchema.safeParse(raw);
  if (!parsed.success) return 0;
  const { locale, items, arrivalDate, departureDate, adults = 2, children = 0 } = parsed.data;
  const today = todayInDakar();
  const start = arrivalDate && arrivalDate > today ? arrivalDate : addDays(today, 7);
  const end = departureDate && departureDate > start ? departureDate : addDays(start, 2);
  const payload = await getPayloadClient();
  const seasons = await loadSeasons(payload);
  const created: CartItem[] = [];
  for (const { kind, slug } of items) {
    const { docs } = await payload.find({
      collection: COLLECTION_OF_KIND[kind],
      locale,
      depth: 0,
      limit: 1,
      where: { and: [{ 'seo.slug': { equals: slug } }, { bookable: { equals: true } }] },
    });
    const doc = docs[0];
    if (!doc) continue;
    const offerType =
      kind === 'experience' && 'offerKind' in doc && doc.offerKind === 'table' ? 'table' : kind;
    const offer = await loadSellableOffer(payload, offerType, doc.id, locale);
    if (!offer) continue;
    const travellers = { adults, children, infants: 0 };
    if (offer.offerType === 'experience' || offer.offerType === 'table') {
      const slot = offer.doc.slots?.[0]?.startTime;
      if (slot) created.push(buildItem(offer, { startDate: start, slot }, travellers, seasons));
    } else if (offer.offerType === 'accommodation') {
      created.push(buildItem(offer, { startDate: start, endDate: end }, travellers, seasons));
    } else if (offer.offerType === 'stay') {
      created.push(buildItem(offer, { startDate: start }, travellers, seasons));
    }
  }
  if (created.length === 0) return 0;
  const { cart, token } = await openOrCreateCart(payload, locale);
  const existing = cart.items ?? [];
  const hasLodging = existing.some((item) => LODGING_TYPES.has(item.offerType));
  let lodgingAdded = hasLodging;
  const kept = created.filter((item) => {
    if (!LODGING_TYPES.has(item.offerType)) return true;
    if (lodgingAdded) return false;
    lodgingAdded = true;
    return true;
  });
  const saved = await saveCartItems(payload, cart, [...existing, ...kept], locale);
  await writeCartCookies(token, cartSummary(saved));
  return kept.length;
};

/**
 * Désinscription des relances (002, US3, T079 ; contrat checkout-actions « unsubscribeReminders »),
 * en un geste depuis le lien de chaque relance : consentement retiré, relances programmées
 * annulées. Un bouton (et non le simple clic sur le lien) : les robots qui ouvrent les liens des
 * messages ne désinscrivent personne.
 */
export const unsubscribeReminders = async (formData: FormData): Promise<void> => {
  const localeValue = formData.get('locale');
  const locale: Locale =
    typeof localeValue === 'string' && isLocale(localeValue) ? localeValue : 'fr';
  const token = formData.get('t');
  const page = checkoutPath(locale, 'unsubscribe');
  const verified = typeof token === 'string' ? verifyReminderLinkToken(token, 'unsubscribe') : null;
  if (!verified) redirect(page);
  const payload = await getPayloadClient();
  const cart = await payload
    .findByID({ collection: 'carts', id: verified.cartId, depth: 0 })
    .catch(() => null);
  if (cart) {
    await payload.update({ collection: 'carts', id: cart.id, data: { remindersConsent: false } });
    await payload.update({
      collection: 'reminders',
      where: {
        and: [
          { targetType: { equals: 'carts' } },
          { targetId: { equals: cart.id } },
          { status: { equals: 'scheduled' } },
        ],
      },
      data: { status: 'cancelled', unsubscribed: true },
    });
  }
  redirect(`${page}?fait=1`);
};

// --- Composer mon séjour (maquette) ------------------------------------------------------
// Un formulaire, un panier : hébergement, expériences et transfert ajoutés d'un coup, prix
// recalculés côté serveur. Une offre « sur demande » mène au formulaire de demande prérempli.

const composeSchema = z.object({
  arrivee: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nuits: z.coerce.number().int().min(COMPOSE_LIMITS.minNights).max(COMPOSE_LIMITS.maxNights),
  voyageurs: z.coerce.number().int().min(COMPOSE_LIMITS.minGuests).max(COMPOSE_LIMITS.maxGuests),
  hebergement: z.coerce.number().int().positive(),
  experience: z.array(z.coerce.number().int().positive()).max(12),
  transfert: z.coerce.number().int().positive().optional(),
});

const composeUrl = (locale: Locale, params: Record<string, string> = {}): string => {
  const query = new URLSearchParams(params).toString();
  return `${checkoutPath(locale, 'compose')}${query ? `?${query}` : ''}`;
};

/** Offre d'expérience vendable, quel que soit son type (activité ou table). */
const loadExperienceOffer = async (payload: Payload, id: number, locale: Locale) =>
  (await loadSellableOffer(payload, 'experience', id, locale)) ??
  (await loadSellableOffer(payload, 'table', id, locale));

/** Formulaire de demande prérempli (offres « sur demande »). */
const requestUrlFor = async (
  payload: Payload,
  locale: Locale,
  input: z.infer<typeof composeSchema>,
): Promise<string> => {
  const slugOf = async (collection: 'accommodations' | 'experiences', id: number) => {
    const doc = await payload
      .findByID({ collection, id, locale, depth: 0, disableErrors: true })
      .catch(() => null);
    return doc?.seo?.slug ?? null;
  };
  const params = new URLSearchParams();
  const lodging = await slugOf('accommodations', input.hebergement);
  if (lodging) params.append('accommodation', lodging);
  for (const id of input.experience) {
    const slug = await slugOf('experiences', id);
    if (slug) params.append('experience', slug);
  }
  params.set('arrivee', input.arrivee);
  params.set('depart', addDays(input.arrivee, input.nuits));
  params.set('adultes', String(input.voyageurs));
  return `${buildPath(locale, { type: 'request' })}?${params.toString()}`;
};

export const composeStay = async (formData: FormData): Promise<void> => {
  const locale = localeOf(formData);
  const parsed = composeSchema.safeParse({
    ...formEntries(formData),
    experience: formData.getAll('experience').filter((value) => typeof value === 'string'),
  });
  if (!parsed.success) redirect(composeUrl(locale, { erreur: 'saisie' }));
  const input = parsed.data;

  const payload = await getPayloadClient();
  const lodging = await loadSellableOffer(payload, 'accommodation', input.hebergement, locale);
  const experiences = await Promise.all(
    input.experience.map((id) => loadExperienceOffer(payload, id, locale)),
  );
  const transfer = input.transfert
    ? await loadSellableOffer(payload, 'transfer', input.transfert, locale)
    : null;
  // Une offre non réservable en ligne : le séjour passe par une demande (aucun paiement).
  if (!lodging || lodging.offerType !== 'accommodation' || experiences.some((offer) => !offer)) {
    redirect(await requestUrlFor(payload, locale, input));
  }
  if (input.transfert && (!transfer || transfer.offerType !== 'transfer')) {
    redirect(composeUrl(locale, { erreur: 'indisponible' }));
  }

  const plan = planComposition({
    startDate: input.arrivee,
    nights: input.nuits,
    guests: input.voyageurs,
    lodging: {
      id: lodging.doc.id,
      lowSeasonPerNight: lodging.doc.pricing.lowSeasonPerNight,
      highSeasonPerNight: lodging.doc.pricing.highSeasonPerNight,
    },
    experiences: experiences.flatMap((offer) =>
      offer && (offer.offerType === 'experience' || offer.offerType === 'table')
        ? [
            {
              id: offer.doc.id,
              offerType: offer.offerType,
              pricePerPerson: offer.doc.pricePerPerson,
              childPercent: offer.doc.childPricePercent,
              slots: (offer.doc.slots ?? []).map((slot) => slot.startTime),
            },
          ]
        : [],
    ),
    transfer:
      transfer && transfer.offerType === 'transfer'
        ? { id: transfer.doc.id, tiers: transfer.doc.priceTiers ?? [] }
        : null,
  });

  const seasons = await loadSeasons(payload);
  const travellers: Travellers = { adults: input.voyageurs, children: 0, infants: 0 };
  const offerById = (offerType: CartItem['offerType'], id: number): SellableOffer | null => {
    if (offerType === 'accommodation') return lodging;
    if (offerType === 'transfer') return transfer;
    return experiences.find((offer) => offer?.doc.id === id) ?? null;
  };
  const offerFor = (line: PlannedLine): SellableOffer | null =>
    offerById(line.offerType, line.offerId);
  const items = plan.flatMap((line): CartItem[] => {
    const offer = offerFor(line);
    if (!offer) return [];
    switch (line.offerType) {
      case 'accommodation':
        return [
          buildItem(
            offer,
            { startDate: line.startDate, endDate: line.endDate },
            travellers,
            seasons,
          ),
        ];
      case 'experience':
      case 'table':
        return [buildItem(offer, { startDate: line.date, slot: line.slot }, travellers, seasons)];
      case 'transfer':
        return [
          buildItem(
            offer,
            { startDate: line.outboundDate, direction: 'outbound', time: line.outboundTime },
            travellers,
            seasons,
          ),
          buildItem(
            offer,
            { startDate: line.returnDate, direction: 'return', time: line.returnTime },
            travellers,
            seasons,
          ),
        ];
      default: {
        const unreachable: never = line;
        return unreachable;
      }
    }
  });

  const today = todayInDakar();
  const intrinsic = validateCart(
    items.flatMap((item) => {
      const id = typeof item.offer.value === 'number' ? item.offer.value : item.offer.value.id;
      const offer = offerById(item.offerType, id);
      return offer ? [toCartLine(item, offer)] : [];
    }),
    { today },
  ).find((issue) => INTRINSIC_ISSUES.has(issue.code));
  if (intrinsic) redirect(composeUrl(locale, { erreur: intrinsic.code }));

  // Le séjour composé remplace le contenu du panier (annoncé sur la page quand il n'est pas vide).
  const { cart, token } = await openOrCreateCart(payload, locale);
  const saved = await saveCartItems(payload, cart, items, locale);
  await writeCartCookies(token, cartSummary(saved));
  redirect(cartUrl(locale, { compose: '1' }));
};
