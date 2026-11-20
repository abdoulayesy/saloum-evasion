import type { Payload } from 'payload';
import { isAutoRefundDue } from '@/lib/booking/availability';
import { applyUnavailableChoice } from '@/lib/booking/unavailableChoice';

// Remboursement intégral automatique d'une prestation indisponible sans choix du voyageur au
// bout de 48 h (002, US4, T089, FR-005). Exécutée à chaque passage de /api/jobs/run.

export const runUnavailableAutoRefund = async (
  payload: Payload,
  now: Date = new Date(),
): Promise<number> => {
  const { docs } = await payload.find({
    collection: 'bookings',
    where: {
      and: [
        { status: { in: ['paid', 'deposit_paid'] } },
        { 'lines.availabilityStatus': { equals: 'unavailable' } },
        { 'lines.choiceDeadline': { less_than_equal: now.toISOString() } },
      ],
    },
    limit: 50,
    depth: 0,
  });
  let refunded = 0;
  for (const booking of docs) {
    for (const line of booking.lines ?? []) {
      if (!isAutoRefundDue(line, now)) continue;
      // Relire la réservation : un remboursement précédent a pu la modifier.
      const current = await payload.findByID({ collection: 'bookings', id: booking.id, depth: 0 });
      if (await applyUnavailableChoice(payload, current, line.lineId, 'refund')) refunded += 1;
    }
  }
  return refunded;
};
