import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';

// Cookies du panier (002, T032 ; research R3) :
// - `se_cart` : jeton aléatoire de 128 bits, HttpOnly, Secure (production), SameSite=Lax, 7 jours ;
//   seule son empreinte SHA-256 est stockée dans `carts.tokenHash` ;
// - `se_cart_summary` : « nombre.total » lisible par l'îlot de la barre collante, sans aucune
//   donnée personnelle. Les pages publiques ne lisent jamais ces cookies au rendu (statiques).

export const CART_COOKIE = 'se_cart';
export const CART_SUMMARY_COOKIE = 'se_cart_summary';
export const CART_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

export type CartSummary = { count: number; total: number };

export const newCartToken = (): string => randomBytes(16).toString('base64url');

export const hashCartToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

/** Jeton bien formé (22 caractères base64url) : évite toute requête sur une valeur fantaisiste. */
export const isCartToken = (value: string | undefined): value is string =>
  typeof value === 'string' && /^[A-Za-z0-9_-]{22}$/.test(value);

export const encodeCartSummary = ({ count, total }: CartSummary): string => `${count}.${total}`;

export const parseCartSummary = (value: string | undefined): CartSummary | null => {
  const match = /^(\d{1,3})\.(\d{1,12})$/.exec(value ?? '');
  if (!match) return null;
  const count = Number(match[1]);
  const total = Number(match[2]);
  return count > 0 ? { count, total } : null;
};

const baseOptions = {
  path: '/',
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: CART_COOKIE_MAX_AGE,
} as const;

/** Jeton du panier du visiteur (Server Action ou page dynamique du tunnel). */
export const readCartToken = async (): Promise<string | null> => {
  const value = (await cookies()).get(CART_COOKIE)?.value;
  return isCartToken(value) ? value : null;
};

/** Pose ou prolonge les deux cookies (à appeler depuis une Server Action ou un gestionnaire de route). */
export const writeCartCookies = async (token: string, summary: CartSummary): Promise<void> => {
  const store = await cookies();
  store.set(CART_COOKIE, token, { ...baseOptions, httpOnly: true });
  if (summary.count > 0) {
    store.set(CART_SUMMARY_COOKIE, encodeCartSummary(summary), { ...baseOptions, httpOnly: false });
  } else {
    store.delete(CART_SUMMARY_COOKIE);
  }
};

export const clearCartCookies = async (): Promise<void> => {
  const store = await cookies();
  store.delete(CART_COOKIE);
  store.delete(CART_SUMMARY_COOKIE);
};
