'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { sendPaymentReminder } from '@/lib/cart/paymentReminder';
import { getPayloadClient } from '@/lib/cms/queries';
import { ABANDONED_CARTS_PATH } from './abandonedCartsPath';

// Action « Renvoyer un lien de paiement » de la vue des paniers abandonnés (002, US3, T080,
// FR-032) : réservée aux rôles `admin` et `operations`, envoie par e-mail et WhatsApp un lien
// de reprise signé (source `team`, valable 7 jours) pour une réservation encore impayée.

const ALLOWED_ROLES = new Set(['admin', 'operations']);

export const resendPaymentLink = async (formData: FormData): Promise<void> => {
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: await headers() });
  const role = user && 'role' in user ? user.role : null;
  if (typeof role !== 'string' || !ALLOWED_ROLES.has(role)) redirect('/admin/login');

  const bookingId = Number(formData.get('bookingId'));
  if (!Number.isInteger(bookingId) || bookingId <= 0) redirect(ABANDONED_CARTS_PATH);
  const booking = await payload
    .findByID({ collection: 'bookings', id: bookingId, depth: 0 })
    .catch(() => null);
  if (!booking || booking.status !== 'awaiting_payment') {
    redirect(`${ABANDONED_CARTS_PATH}?erreur=statut`);
  }
  const cartId = typeof booking.cart === 'number' ? booking.cart : booking.cart.id;
  const cart = await payload.findByID({ collection: 'carts', id: cartId, depth: 0 });
  await sendPaymentReminder(payload, {
    booking,
    cart,
    origin: { kind: 'team' },
    channels: ['email', 'whatsapp'],
  });
  redirect(`${ABANDONED_CARTS_PATH}?envoye=${booking.reference}`);
};
