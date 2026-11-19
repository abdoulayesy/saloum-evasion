import type { Payload } from 'payload';
import type { Booking } from '@/payload-types';
import { alternativeOutcome, type TravellerChoice } from './availability';
import { linePaidAmounts } from './refundRules';

// Choix pour une prestation indisponible (002, US4, T089, FR-005, FR-030) : alternative ou
// remboursement intégral, par le voyageur (page de la réservation) ou automatiquement après
// 48 h. Les remboursements passent par le workflow `refunds` (motif `unavailable`).

type BookingLine = NonNullable<Booking['lines']>[number];

const createUnavailableRefund = (
  payload: Payload,
  booking: Booking,
  lineId: string,
  amount: number,
) =>
  payload.create({
    collection: 'refunds',
    data: {
      booking: booking.id,
      lines: [{ lineId, amount }],
      amount,
      calculatedAmount: amount,
      reason: 'unavailable',
      method: 'original',
      status: 'requested',
    },
  });

/** Ligne indisponible sur laquelle le voyageur peut encore choisir. */
export const isChoosable = (line: BookingLine): boolean =>
  line.availabilityStatus === 'unavailable' && !line.travellerChoice && !line.cancelled;

/**
 * Applique le choix : remboursement intégral de ce qui a été payé pour la ligne, ou alternative
 * (titre et prix remplacés, jamais au-dessus du prix d'origine, écart déjà payé remboursé).
 * Renvoie `false` si la ligne n'est plus en attente de choix.
 */
export const applyUnavailableChoice = async (
  payload: Payload,
  booking: Booking,
  lineId: string,
  choice: TravellerChoice,
): Promise<boolean> => {
  const lines = booking.lines ?? [];
  const line = lines.find((candidate) => candidate.lineId === lineId);
  if (!line || !isChoosable(line)) return false;
  const paid = linePaidAmounts(booking.amountPaid, lines).get(lineId) ?? 0;

  if (choice === 'refund') {
    await payload.update({
      collection: 'bookings',
      id: booking.id,
      data: {
        lines: lines.map((candidate) =>
          candidate.lineId === lineId ? { ...candidate, travellerChoice: 'refund' } : candidate,
        ),
      },
    });
    await createUnavailableRefund(payload, booking, lineId, paid);
    return true;
  }

  const alternative = (line.alternatives ?? [])[choice === 'alternative_1' ? 0 : 1];
  if (!alternative) return false;
  const outcome = alternativeOutcome({
    originalTotal: line.lineTotal,
    paidForLine: paid,
    alternativePrice: alternative.price,
  });
  const total = booking.total - outcome.totalReduction;
  await payload.update({
    collection: 'bookings',
    id: booking.id,
    data: {
      total,
      // Solde restant après remboursement de l'écart déjà payé (acompte : le solde baisse).
      balanceAmount:
        booking.paymentPlan === 'deposit'
          ? Math.max(0, total - (booking.amountPaid - outcome.refund))
          : 0,
      lines: lines.map((candidate) =>
        candidate.lineId === lineId
          ? {
              ...candidate,
              title: alternative.title,
              lineTotal: outcome.lineTotal,
              unitPrice: outcome.lineTotal,
              availabilityStatus: 'replaced',
              travellerChoice: choice,
            }
          : candidate,
      ),
    },
  });
  if (outcome.refund > 0) await createUnavailableRefund(payload, booking, lineId, outcome.refund);
  return true;
};
