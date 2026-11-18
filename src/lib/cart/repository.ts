import type { Payload } from 'payload';
import type { Cart } from '@/payload-types';
import { hashCartToken, newCartToken, type CartSummary } from './cookies';

// Dépôt des paniers (002, T032) : lecture par jeton, création, enregistrement des lignes avec
// incrément de `version` (clé d'idempotence de la réservation) et prolongation de l'expiration.
// Module serveur : API locale de Payload (accès public interdit sur `carts`).

type Locale = 'fr' | 'en';

export type CartItem = NonNullable<Cart['items']>[number];

const DEFAULT_TTL_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

const ttlDays = async (payload: Payload): Promise<number> => {
  const settings = await payload.findGlobal({ slug: 'siteSettings', depth: 0 });
  return settings.checkout?.cartTtlDays ?? DEFAULT_TTL_DAYS;
};

const expiry = (days: number, now = Date.now()): string =>
  new Date(now + days * DAY_MS).toISOString();

/** Panier ouvert et non expiré correspondant au jeton du cookie, ou `null`. */
export const findOpenCart = async (payload: Payload, token: string): Promise<Cart | null> => {
  const { docs } = await payload.find({
    collection: 'carts',
    where: {
      and: [
        { tokenHash: { equals: hashCartToken(token) } },
        { status: { equals: 'open' } },
        { expiresAt: { greater_than: new Date().toISOString() } },
      ],
    },
    limit: 1,
    depth: 0,
  });
  return docs[0] ?? null;
};

/** Panier du cookie quel que soit son statut (accès à la réservation après le paiement). */
export const findCartByToken = async (payload: Payload, token: string): Promise<Cart | null> => {
  const { docs } = await payload.find({
    collection: 'carts',
    where: { tokenHash: { equals: hashCartToken(token) } },
    limit: 1,
    depth: 0,
  });
  return docs[0] ?? null;
};

export const createCart = async (
  payload: Payload,
  locale: Locale,
): Promise<{ cart: Cart; token: string }> => {
  const token = newCartToken();
  const cart = await payload.create({
    collection: 'carts',
    data: {
      tokenHash: hashCartToken(token),
      locale,
      items: [],
      version: 0,
      remindersSent: 0,
      remindersConsent: false,
      status: 'open',
      expiresAt: expiry(await ttlDays(payload)),
    },
  });
  return { cart, token };
};

/** Remplace les lignes, incrémente la version et prolonge l'expiration du panier. */
export const saveCartItems = async (
  payload: Payload,
  cart: Cart,
  items: CartItem[],
  locale: Locale = cart.locale,
): Promise<Cart> =>
  payload.update({
    collection: 'carts',
    id: cart.id,
    data: {
      items,
      locale,
      version: (cart.version ?? 0) + 1,
      expiresAt: expiry(await ttlDays(payload)),
    },
  });

/** Nombre de lignes et total vu à l'ajout, pour `se_cart_summary`. */
export const cartSummary = (cart: Pick<Cart, 'items'>): CartSummary => {
  const items = cart.items ?? [];
  return { count: items.length, total: items.reduce((sum, item) => sum + item.quotedTotal, 0) };
};
