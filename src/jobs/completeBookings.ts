import type { Payload } from 'payload';
import { isCompletionDue } from '@/lib/booking/lifecycle';

// Passage automatique `completed` (002, T100 ; data-model, machine à états) : une réservation
// payée, à acompte ou partiellement annulée dont la dernière prestation est passée. Quotidien.

const BATCH = 200;

export const runCompleteBookings = async (
  payload: Payload,
  now: Date = new Date(),
): Promise<number> => {
  const today = now.toISOString().slice(0, 10);
  // Préfiltre : la dernière prestation n'est jamais antérieure à la première date.
  const { docs } = await payload.find({
    collection: 'bookings',
    where: {
      and: [
        { status: { in: ['paid', 'deposit_paid', 'partially_cancelled'] } },
        { firstArrivalDate: { less_than: today } },
      ],
    },
    limit: BATCH,
    depth: 0,
    select: { status: true, lines: true },
  });
  let completed = 0;
  for (const booking of docs) {
    if (!isCompletionDue(booking, today)) continue;
    await payload.update({
      collection: 'bookings',
      id: booking.id,
      data: { status: 'completed' },
      depth: 0,
    });
    completed += 1;
  }
  return completed;
};
