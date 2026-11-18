import type { Payload } from 'payload';
import { addDays } from '@/lib/checkout/deposit';
import type { Season } from '@/lib/checkout/pricing';
import { validateCart, type CartIssueCode, type CartLine } from '@/lib/checkout/validateCart';
import {
  loadSellableOffer,
  offerCapacity,
  offerMinNights,
  priceOfferLine,
  type SellableOffer,
} from './offers';
import type { CartItem } from './repository';

// Revalidation serveur du panier (FR-004, FR-009) : offre toujours publiée et vendable,
// cohérence des dates et capacités, prix recalculé à comparer au prix vu à l'ajout.

type Locale = 'fr' | 'en';

export type LineIssue = CartIssueCode | 'unavailable' | 'invalid_slot';

export type ReviewedLine = {
  item: CartItem;
  offer: SellableOffer | null;
  title: string;
  issues: LineIssue[];
  /** Prix recalculé ; diffère de `item.quotedTotal` si le tarif a changé. */
  currentTotal: number;
};

const relationValue = (item: CartItem): number =>
  typeof item.offer.value === 'number' ? item.offer.value : item.offer.value.id;

/** Date de fin effective (séjour : arrivée + nombre de nuits). */
export const lineEndDate = (item: CartItem, offer: SellableOffer | null): string | undefined => {
  if (offer?.offerType === 'stay') return addDays(item.startDate, offer.doc.durationNights);
  return item.endDate ?? undefined;
};

export const toCartLine = (item: CartItem, offer: SellableOffer): CartLine => ({
  lineId: item.lineId,
  offerType: item.offerType,
  startDate: item.startDate,
  endDate: lineEndDate(item, offer),
  transferDirection: item.transferDirection ?? undefined,
  adults: item.adults,
  children: item.children,
  infants: item.infants,
  capacity: offerCapacity(offer),
  minNights: offerMinNights(offer),
});

/** Problèmes propres à une ligne (bloquants à l'ajout) ; la composition est vérifiée au panier. */
export const INTRINSIC_ISSUES: ReadonlySet<CartIssueCode> = new Set([
  'invalid_nights',
  'below_min_nights',
  'over_capacity',
  'no_adult',
  'too_soon',
]);

export const reviewCart = async (
  payload: Payload,
  items: readonly CartItem[],
  { locale, today, seasons }: { locale: Locale; today: string; seasons: readonly Season[] },
): Promise<ReviewedLine[]> => {
  const offers = await Promise.all(
    items.map((item) => loadSellableOffer(payload, item.offerType, relationValue(item), locale)),
  );
  const lines: CartLine[] = items.flatMap((item, index) => {
    const offer = offers[index];
    return offer ? [toCartLine(item, offer)] : [];
  });
  const issues = validateCart(lines, { today });
  return items.map((item, index) => {
    const offer = offers[index] ?? null;
    const lineIssues: LineIssue[] = issues
      .filter((issue) => issue.lineId === item.lineId)
      .map((issue) => issue.code);
    if (!offer) lineIssues.unshift('unavailable');
    if (
      offer &&
      (offer.offerType === 'experience' || offer.offerType === 'table') &&
      !(offer.doc.slots ?? []).some((slot) => slot.startTime === item.slot)
    )
      lineIssues.push('invalid_slot');
    const currentTotal = offer
      ? priceOfferLine(
          offer,
          { startDate: item.startDate, endDate: lineEndDate(item, offer) },
          { adults: item.adults, children: item.children, infants: item.infants },
          seasons,
        ).total
      : 0;
    return { item, offer, title: offer?.doc.title ?? '', issues: lineIssues, currentTotal };
  });
};

/** Panier payable : au moins une ligne et aucun problème. */
export const isCartPayable = (reviewed: readonly ReviewedLine[]): boolean =>
  reviewed.length > 0 && reviewed.every((line) => line.issues.length === 0);

/** Date du jour à Dakar (UTC). */
export const todayInDakar = (now: Date = new Date()): string => now.toISOString().slice(0, 10);
