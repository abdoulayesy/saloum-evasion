import type { Payload } from 'payload';
import { todayInDakar } from '@/lib/cart/validate';
import { paymentPlan, type PaymentPlan } from '@/lib/checkout/deposit';
import type { Booking } from '@/payload-types';

// Plan de paiement possible pour une réservation (002, FR-016) : acompte proposé au-delà du seuil
// des réglages, sauf si un séjour du panier exige le paiement total. Partagé par la page
// paiement (affichage des deux montants) et `startPayment` (contrôle serveur).
export const bookingPaymentPlan = async (
  payload: Payload,
  booking: Booking,
  now: Date = new Date(),
): Promise<PaymentPlan> => {
  const stayIds = (booking.lines ?? []).flatMap((line) =>
    line.offerType === 'stay' && typeof line.offer.value === 'number' ? [line.offer.value] : [],
  );
  const [stays, settings] = await Promise.all([
    stayIds.length
      ? payload.find({
          collection: 'stays',
          where: { id: { in: stayIds } },
          depth: 0,
          limit: stayIds.length,
        })
      : Promise.resolve({ docs: [] }),
    payload.findGlobal({ slug: 'siteSettings', depth: 0 }),
  ]);
  return paymentPlan({
    total: booking.total,
    today: todayInDakar(now),
    firstArrivalDate: booking.firstArrivalDate,
    requireFullPayment: stays.docs.some((stay) => stay.requireFullPayment === true),
    settings: {
      depositPercent: settings.checkout.depositPercent,
      depositThresholdDays: settings.checkout.depositThresholdDays,
      balanceDueDaysBeforeArrival: settings.checkout.balanceDueDaysBeforeArrival,
    },
  });
};
