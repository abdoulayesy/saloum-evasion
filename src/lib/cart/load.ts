import type { Payload } from 'payload';
import type { Locale } from '@/i18n/routing';
import type { SummarySourceLine } from '@/lib/checkout/summary';
import type { Cart } from '@/payload-types';
import { readCartToken } from './cookies';
import { loadSeasons } from './offers';
import { findOpenCart } from './repository';
import { reviewCart, todayInDakar, type ReviewedLine } from './validate';

// Lecture du panier du visiteur pour les pages du tunnel (002) : panier ouvert, lignes revues
// (FR-004) et lignes de récapitulatif (source unique FR-010).

export type CartState = {
  cart: Cart | null;
  /** Cookie présent mais panier introuvable ou expiré. */
  expired: boolean;
  reviewed: ReviewedLine[];
};

export const loadCartState = async (payload: Payload, locale: Locale): Promise<CartState> => {
  const token = await readCartToken();
  const cart = token ? await findOpenCart(payload, token) : null;
  if (!cart) return { cart: null, expired: Boolean(token), reviewed: [] };
  const seasons = await loadSeasons(payload);
  const reviewed = await reviewCart(payload, cart.items ?? [], {
    locale,
    today: todayInDakar(),
    seasons,
  });
  return { cart, expired: false, reviewed };
};

/** Prix actuel d'une ligne encore vendable (prix vu à l'ajout si l'offre a disparu). */
export const linePrice = (line: ReviewedLine): number =>
  line.offer ? line.currentTotal : line.item.quotedTotal;

/** Total du panier : prix du jour des lignes vendables (une ligne indisponible en est retirée). */
export const cartTotal = (reviewed: readonly ReviewedLine[]): number =>
  reviewed.reduce((sum, line) => sum + (line.offer ? line.currentTotal : 0), 0);

/** Ligne de récapitulatif à partir d'une ligne revue (prix du jour, US3 scénario 3). */
export const summaryLineOf = (line: ReviewedLine): SummarySourceLine => ({
  lineId: line.item.lineId,
  offerType: line.item.offerType,
  title: line.title || '—',
  startDate: line.item.startDate,
  endDate: line.offer?.offerType === 'stay' ? undefined : (line.item.endDate ?? undefined),
  slot: line.item.slot ?? undefined,
  transferDirection: line.item.transferDirection ?? undefined,
  transferTime: line.item.transferTime ?? undefined,
  adults: line.item.adults,
  children: line.item.children,
  infants: line.item.infants,
  lineTotal: linePrice(line),
});
