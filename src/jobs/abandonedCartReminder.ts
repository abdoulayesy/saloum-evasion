import type { Payload } from 'payload';
import { findBookingForCart } from '@/lib/booking/createBooking';
import { sendPaymentReminder } from '@/lib/cart/paymentReminder';
import { ABANDON_REMINDER_WINDOW_DAYS, dueAbandonReminder } from '@/lib/checkout/abandonSchedule';
import type { Cart } from '@/payload-types';

// Relances des paniers abandonnés et des paiements échoués (002, US3, T078, FR-031) : au plus
// deux (1 h, 24 h), consentement requis, rien pour un panier commandé ni pendant un paiement en
// cours. Chaque relance est inscrite au journal `reminders` (type `abandoned_cart`, index unique
// panier + type + canal + rang) avant l'envoi : jamais deux fois la même, même en parallèle.
// Exécutée à chaque passage de /api/jobs/run.

const BATCH = 100;
const HOUR_MS = 60 * 60 * 1000;

type Channel = 'email' | 'whatsapp';

/** Inscrit la relance ; `false` si elle l'est déjà (index unique). */
const claim = async (
  payload: Payload,
  cart: Cart,
  rank: 1 | 2,
  channel: Channel,
  now: Date,
): Promise<boolean> => {
  try {
    await payload.create({
      collection: 'reminders',
      data: {
        targetType: 'carts',
        targetId: cart.id,
        kind: 'abandoned_cart',
        channel,
        rank,
        scheduledFor: now.toISOString(),
        sentAt: now.toISOString(),
        status: 'sent',
      },
    });
    return true;
  } catch {
    return false;
  }
};

const remindCart = async (payload: Payload, cart: Cart, now: Date): Promise<boolean> => {
  const booking = await findBookingForCart(payload, cart);
  if (!booking || booking.status !== 'awaiting_payment') return false;
  const [sent, active] = await Promise.all([
    payload.find({
      collection: 'reminders',
      where: {
        and: [
          { targetType: { equals: 'carts' } },
          { targetId: { equals: cart.id } },
          { kind: { equals: 'abandoned_cart' } },
        ],
      },
      limit: 10,
      depth: 0,
    }),
    payload.count({
      collection: 'payments',
      where: {
        and: [
          { booking: { equals: booking.id } },
          { status: { in: ['initiated', 'pending'] } },
          { expiresAt: { greater_than: now.toISOString() } },
        ],
      },
    }),
  ]);
  const rank = dueAbandonReminder({
    consent: cart.remindersConsent === true,
    cartStatus: cart.status,
    bookingStatus: booking.status,
    paymentInProgress: active.totalDocs > 0,
    lastActivityAt: booking.updatedAt,
    now,
    sentRanks: [...new Set(sent.docs.map((entry) => entry.rank))],
  });
  if (rank === null) return false;
  const channels: Channel[] = [];
  for (const channel of ['email', 'whatsapp'] as const) {
    if (await claim(payload, cart, rank, channel, now)) channels.push(channel);
  }
  if (channels.length === 0) return false;
  await sendPaymentReminder(payload, {
    booking,
    cart,
    origin: { kind: 'reminder', rank },
    channels,
  });
  await payload.update({
    collection: 'carts',
    id: cart.id,
    data: { remindersSent: Math.max(cart.remindersSent ?? 0, rank) },
  });
  return true;
};

export const runAbandonedCartReminders = async (
  payload: Payload,
  now: Date = new Date(),
): Promise<number> => {
  // Point de départ : les paniers ouverts qui ont accepté les relances et n'en ont pas reçu deux
  // (quelques lignes), et non toutes les réservations impayées : la tâche passe chaque minute.
  const earliest = new Date(now.getTime() - (ABANDON_REMINDER_WINDOW_DAYS + 1) * 24 * HOUR_MS);
  let reminded = 0;
  for (let page = 1, hasNextPage = true; hasNextPage; page += 1) {
    const result = await payload.find({
      collection: 'carts',
      where: {
        and: [
          { status: { equals: 'open' } },
          { remindersConsent: { equals: true } },
          { remindersSent: { less_than: 2 } },
          { updatedAt: { greater_than_equal: earliest.toISOString() } },
        ],
      },
      sort: 'id',
      page,
      limit: BATCH,
      depth: 0,
    });
    hasNextPage = result.hasNextPage;
    for (const cart of result.docs) {
      if (await remindCart(payload, cart, now)) reminded += 1;
    }
  }
  return reminded;
};
