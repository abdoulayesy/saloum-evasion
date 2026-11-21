import type { Payload } from 'payload';
import { isCartPurgeDue, isUnpaidBookingExpiryDue, purgeCutoff } from '@/lib/booking/lifecycle';

// Purge quotidienne (002, T100 ; spec « Rétention ») : les réservations jamais payées et
// inchangées depuis 30 jours passent `expired` ; les paniers non commandés inchangés depuis
// 30 jours et sans réservation sont supprimés, avec leurs relances. Un panier rattaché à une
// réservation (relation obligatoire) est conservé avec elle.

const BATCH = 200;

const relationId = (value: number | { id: number }): number =>
  typeof value === 'number' ? value : value.id;

export type PurgeResult = { expiredBookings: number; deletedCarts: number };

export const runPurgeCarts = async (
  payload: Payload,
  now: Date = new Date(),
): Promise<PurgeResult> => {
  const cutoff = purgeCutoff(now);
  const unpaid = await payload.find({
    collection: 'bookings',
    where: {
      and: [{ status: { equals: 'awaiting_payment' } }, { updatedAt: { less_than_equal: cutoff } }],
    },
    limit: BATCH,
    depth: 0,
    select: { status: true, amountPaid: true, updatedAt: true },
  });
  let expiredBookings = 0;
  for (const booking of unpaid.docs) {
    if (!isUnpaidBookingExpiryDue(booking, now)) continue;
    await payload.update({
      collection: 'bookings',
      id: booking.id,
      data: { status: 'expired' },
      depth: 0,
    });
    expiredBookings += 1;
  }

  const stale = await payload.find({
    collection: 'carts',
    where: {
      and: [{ status: { not_equals: 'checked_out' } }, { updatedAt: { less_than_equal: cutoff } }],
    },
    limit: BATCH,
    depth: 0,
    select: { status: true, updatedAt: true },
  });
  const candidates = stale.docs.filter((cart) => isCartPurgeDue(cart, now)).map((cart) => cart.id);
  if (candidates.length === 0) return { expiredBookings, deletedCarts: 0 };
  const booked = await payload.find({
    collection: 'bookings',
    where: { cart: { in: candidates } },
    pagination: false,
    depth: 0,
    select: { cart: true },
  });
  const kept = new Set(booked.docs.map((booking) => relationId(booking.cart)));
  const purgeable = candidates.filter((id) => !kept.has(id));
  if (purgeable.length === 0) return { expiredBookings, deletedCarts: 0 };
  await payload.delete({
    collection: 'reminders',
    where: { and: [{ targetType: { equals: 'carts' } }, { targetId: { in: purgeable } }] },
  });
  const deleted = await payload.delete({ collection: 'carts', where: { id: { in: purgeable } } });
  return { expiredBookings, deletedCarts: deleted.docs.length };
};
