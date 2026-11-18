import type { SummarySource } from '@/lib/checkout/summary';
import type { Booking } from '@/payload-types';

// Réservation → source du récapitulatif (FR-010) : la page de confirmation, l'e-mail, le message
// WhatsApp et le bon PDF rendent exactement ces lignes via `summaryLines` / `summaryTotals`.
export const bookingSummarySource = (booking: Booking): SummarySource => ({
  locale: booking.locale,
  total: booking.total,
  paymentPlan: booking.paymentPlan,
  depositAmount: booking.depositAmount,
  balanceAmount: booking.balanceAmount,
  balanceDueDate: booking.balanceDueDate ?? null,
  amountPaid: booking.amountPaid,
  lines: (booking.lines ?? []).map((line) => ({
    lineId: line.lineId,
    offerType: line.offerType,
    title: line.title,
    startDate: line.startDate,
    endDate: line.endDate ?? undefined,
    slot: line.slot ?? undefined,
    transferDirection: line.transferDirection ?? undefined,
    transferTime: line.transferTime ?? undefined,
    adults: line.adults,
    children: line.children,
    infants: line.infants,
    lineTotal: line.lineTotal,
    cancelled: line.cancelled ?? false,
  })),
});
