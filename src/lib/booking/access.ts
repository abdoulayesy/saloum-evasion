import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Payload } from 'payload';
import { readCartToken } from '@/lib/cart/cookies';
import { findCartByToken } from '@/lib/cart/repository';
import type { Booking } from '@/payload-types';

// Accès à une réservation sans compte (002, FR-026, T058) : soit le cookie du panier qui l'a
// créée (même appareil), soit le jeton de gestion envoyé par e-mail et WhatsApp (32 octets,
// seule son empreinte SHA-256 est stockée, révocable en le régénérant).

export const newManageToken = (): { token: string; hash: string } => {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashManageToken(token) };
};

export const hashManageToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

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
