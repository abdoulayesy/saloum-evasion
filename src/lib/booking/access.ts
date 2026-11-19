import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { Payload } from 'payload';
import { readCartToken } from '@/lib/cart/cookies';
import { findCartByToken } from '@/lib/cart/repository';
import type { Booking } from '@/payload-types';

// Accès à une réservation sans compte (002, FR-026, T058) : soit le cookie du panier qui l'a
// créée (même appareil), soit le jeton de gestion envoyé par e-mail et WhatsApp. Seule son
// empreinte SHA-256 est stockée. Le jeton (32 octets) est dérivé du secret du serveur, de la
// réservation et d'une version (research R13) : les rappels du solde et les messages suivants
// renvoient le même lien sans le stocker ; passer à la version suivante révoque l'ancien.

const MAX_TOKEN_VERSION = 20;

const tokenKey = (): Buffer => {
  const secret = process.env.PAYLOAD_SECRET;
  if (!secret) throw new Error('PAYLOAD_SECRET manquant : jeton de gestion impossible.');
  return createHmac('sha256', secret).update('saloum-evasion/booking-manage-token').digest();
};

export const hashManageToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

type TokenSubject = Pick<Booking, 'id' | 'reference'>;

/** Jeton de gestion d'une réservation pour une version donnée (1 = premier lien envoyé). */
export const manageTokenFor = (
  booking: TokenSubject,
  version = 1,
): { token: string; hash: string } => {
  const token = createHmac('sha256', tokenKey())
    .update(`${booking.id}:${booking.reference}:${version}`)
    .digest('base64url');
  return { token, hash: hashManageToken(token) };
};

/**
 * Jeton en vigueur (celui dont l'empreinte est stockée), pour l'écrire dans un message ; `null`
 * si aucun lien n'a été émis ou s'il a été révoqué sans être remplacé.
 */
export const currentManageToken = (
  booking: TokenSubject & Pick<Booking, 'manageTokenHash'>,
): string | null => {
  if (!booking.manageTokenHash) return null;
  for (let version = 1; version <= MAX_TOKEN_VERSION; version += 1) {
    const candidate = manageTokenFor(booking, version);
    if (candidate.hash === booking.manageTokenHash) return candidate.token;
  }
  return null;
};

const safeEqual = (a: string, b: string): boolean => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

const relationId = (value: Booking['cart']): number =>
  typeof value === 'number' ? value : value.id;

export const findBookingByReference = async (
  payload: Payload,
  reference: string,
): Promise<Booking | null> => {
  const { docs } = await payload.find({
    collection: 'bookings',
    where: { reference: { equals: reference } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    showHiddenFields: true,
  });
  return docs[0] ?? null;
};

/** Le visiteur a-t-il accès à cette réservation (jeton de gestion ou cookie du panier) ? */
export const canAccessBooking = async (
  payload: Payload,
  booking: Booking,
  manageToken?: string | null,
): Promise<boolean> => {
  if (
    manageToken &&
    booking.manageTokenHash &&
    safeEqual(hashManageToken(manageToken), booking.manageTokenHash)
  )
    return true;
  const token = await readCartToken();
  if (!token) return false;
  const cart = await findCartByToken(payload, token);
  return cart !== null && cart.id === relationId(booking.cart);
};
