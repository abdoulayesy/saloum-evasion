import type { Payload } from 'payload';
import {
  accommodationPrice,
  experiencePrice,
  stayPrice,
  transferPrice,
  type ChildPricing,
  type Season,
} from '@/lib/checkout/pricing';
import type { OfferType } from '@/lib/checkout/validateCart';
import type { Accommodation, Experience, Stay, Transfer } from '@/payload-types';

// Catalogue vu par le panier (002, T045) : chargement d'une offre vendable et calcul serveur de
// son prix à partir de la source unique (offre + saisons des réglages). Module serveur.

type Locale = 'fr' | 'en';

export type OfferCollection = 'stays' | 'accommodations' | 'experiences' | 'transfers';

export const collectionOf = (offerType: OfferType): OfferCollection => {
  switch (offerType) {
    case 'stay':
      return 'stays';
    case 'accommodation':
      return 'accommodations';
    case 'experience':
    case 'table':
      return 'experiences';
    case 'transfer':
      return 'transfers';
    default: {
      const unreachable: never = offerType;
      return unreachable;
    }
  }
};

const CHILD_MIN_AGE = 4;
const CHILD_MAX_AGE = 11;

const childPricing = (percent: number | null | undefined): ChildPricing => ({
  childPercent: percent ?? 50,
  childMinAge: CHILD_MIN_AGE,
  childMaxAge: CHILD_MAX_AGE,
});

const relationId = (value: unknown): number | null => {
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value !== null && 'id' in value && typeof value.id === 'number')
    return value.id;
  return null;
};

export type SellableOffer =
  | { offerType: 'accommodation'; doc: Accommodation }
  | { offerType: 'stay'; doc: Stay }
  | { offerType: 'experience' | 'table'; doc: Experience }
  | { offerType: 'transfer'; doc: Transfer };

/** Offre publiée et vendable, ou `null`. Le type `table` est celui des expériences « table ». */
export const loadSellableOffer = async (
  payload: Payload,
  offerType: OfferType,
  id: number,
  locale: Locale,
): Promise<SellableOffer | null> => {
  const collection = collectionOf(offerType);
  const doc = await payload
    .findByID({ collection, id, locale, depth: 0, disableErrors: true })
    .catch(() => null);
  if (!doc || doc.bookable !== true) return null;
  if ('_status' in doc && doc._status !== 'published') return null;
  if (relationId(doc.partner) === null) return null;
  switch (collection) {
    case 'accommodations':
      return offerType === 'accommodation' && isAccommodation(doc) ? { offerType, doc } : null;
    case 'stays':
      return offerType === 'stay' && isStay(doc) ? { offerType, doc } : null;
    case 'experiences': {
      if (!isExperience(doc)) return null;
      const kind = doc.offerKind === 'table' ? 'table' : 'experience';
      return offerType === kind ? { offerType: kind, doc } : null;
    }
    case 'transfers':
      return offerType === 'transfer' && isTransfer(doc) ? { offerType, doc } : null;
    default: {
      const unreachable: never = collection;
      return unreachable;
    }
  }
};

const isAccommodation = (doc: object): doc is Accommodation => 'priceFromPerNight' in doc;
const isStay = (doc: object): doc is Stay => 'durationNights' in doc;
const isExperience = (doc: object): doc is Experience => 'pricePerPerson' in doc;
const isTransfer = (doc: object): doc is Transfer => 'priceTiers' in doc;

export const offerTitle = (offer: SellableOffer): string => offer.doc.title ?? '';

export const offerPartnerId = (offer: SellableOffer): number | null =>
  relationId(offer.doc.partner);

export const offerPolicyId = (offer: SellableOffer): number | null =>
  relationId(offer.doc.cancellationPolicy);

/** Capacité en personnes (bébés compris) d'une ligne. */
export const offerCapacity = (offer: SellableOffer): number => {
  switch (offer.offerType) {
    case 'accommodation':
      return offer.doc.capacity;
    case 'stay':
      return offer.doc.maxTravellers ?? 12;
    case 'experience':
    case 'table':
      return offer.doc.maxParticipants;
    case 'transfer':
      return 40;
    default: {
      const unreachable: never = offer;
      return unreachable;
    }
  }
};

export const offerMinNights = (offer: SellableOffer): number | undefined =>
  offer.offerType === 'accommodation' ? offer.doc.minNights : undefined;

export const offerSlots = (offer: SellableOffer): { label: string; startTime: string }[] =>
  offer.offerType === 'experience' || offer.offerType === 'table'
    ? (offer.doc.slots ?? []).map((slot) => ({
        label: slot.label ?? slot.startTime,
        startTime: slot.startTime,
      }))
    : [];

export type LineDates = { startDate: string; endDate?: string };

export type LineTravellers = { adults: number; children: number; infants: number };

/** Prix serveur d'une ligne (XOF entiers). */
export const priceOfferLine = (
  offer: SellableOffer,
  dates: LineDates,
  travellers: LineTravellers,
  seasons: readonly Season[],
): { unitPrice: number; total: number } => {
  switch (offer.offerType) {
    case 'accommodation': {
      const price = accommodationPrice(
        {
          lowSeasonPerNight: offer.doc.pricing?.lowSeasonPerNight ?? offer.doc.priceFromPerNight,
          highSeasonPerNight: offer.doc.pricing?.highSeasonPerNight ?? offer.doc.priceFromPerNight,
        },
        { startDate: dates.startDate, endDate: dates.endDate ?? dates.startDate },
        seasons,
      );
      return { unitPrice: price.unitPrice, total: price.total };
    }
    case 'stay':
      return stayPrice(
        {
          lowSeasonPerPerson: offer.doc.pricing.lowSeasonPerPerson,
          highSeasonPerPerson: offer.doc.pricing.highSeasonPerPerson,
          child: childPricing(offer.doc.childPricePercent),
        },
        { startDate: dates.startDate, ...travellers },
        seasons,
      );
    case 'experience':
    case 'table':
      return experiencePrice(
        {
          pricePerPerson: offer.doc.pricePerPerson,
          child: childPricing(offer.doc.childPricePercent),
        },
        travellers,
      );
    case 'transfer': {
      const passengers = travellers.adults + travellers.children + travellers.infants;
      const { total } = transferPrice(offer.doc.priceTiers ?? [], passengers);
      return { unitPrice: total, total };
    }
    default: {
      const unreachable: never = offer;
      return unreachable;
    }
  }
};

/** Saisons hautes des réglages du site. */
export const loadSeasons = async (payload: Payload): Promise<Season[]> => {
  const settings = await payload.findGlobal({ slug: 'siteSettings', depth: 0 });
  return (settings.highSeasons ?? []).map(({ from, to }) => ({ from, to }));
};
