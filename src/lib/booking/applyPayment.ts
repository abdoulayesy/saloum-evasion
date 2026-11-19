import type { Payload } from 'payload';
import { availabilityDeadline } from '@/lib/checkout/availabilityDeadline';
import { allocateAmount, collectedEntry } from '@/lib/checkout/commission';
import { rateFor, type RateEntry } from '@/lib/checkout/commissionRate';
import { checkoutPath } from '@/lib/checkout/paths';
import { assertBookingTransition, bookingStatusAfterPayment } from '@/lib/checkout/stateMachines';
import { enqueueNotification } from '@/jobs/sendNotification';
import {
  bookingConfirmedEmail,
  bookingConfirmedWhatsApp,
} from '@/lib/notifications/templates/bookingConfirmed';
import { teamBookingEmail } from '@/lib/notifications/templates/internal';
import { siteUrl } from '@/lib/site';
import type { Booking, Payment } from '@/payload-types';
import { newManageToken } from './access';

// Effets d'un paiement réussi (002, T056, contrat payment-gateway étape 5) : statut et montant
// payé, taux de commission figés et écritures de commission (FR-034), échéance de confirmation
// de disponibilité (FR-005), jeton de gestion, panier commandé, notifications (voyageur et
// équipe). Appelé une seule fois par paiement (garanti par `processNotification`).

const relationId = (value: number | { id: number }): number =>
  typeof value === 'number' ? value : value.id;

const todayOf = (date: Date): string => date.toISOString().slice(0, 10);

export const applySuccessfulPayment = async (payload: Payload, paymentId: number, paidAt: Date) => {
  const payment: Payment = await payload.findByID({
    collection: 'payments',
    id: paymentId,
    depth: 0,
  });
  const booking: Booking = await payload.findByID({
    collection: 'bookings',
    id: relationId(payment.booking),
    depth: 0,
    showHiddenFields: true,
  });
  const nextStatus = bookingStatusAfterPayment(payment.purpose);
  assertBookingTransition(booking.status, nextStatus);

  const [rates, settings, previous] = await Promise.all([
    payload.findGlobal({ slug: 'commissionRates', depth: 0 }),
    payload.findGlobal({ slug: 'siteSettings', depth: 0 }),
    payload.find({
      collection: 'commissionEntries',
      where: { and: [{ booking: { equals: booking.id } }, { kind: { equals: 'collected' } }] },
      limit: 500,
      depth: 0,
    }),
  ]);
  const rateEntries: RateEntry[] = (rates.rates ?? []).map((rate) => ({
    offerType: rate.offerType,
    rateBp: rate.rateBp,
    effectiveFrom: rate.effectiveFrom,
  }));
  const today = todayOf(paidAt);
  const activeLines = (booking.lines ?? []).filter((line) => !line.cancelled);
  const shares = allocateAmount(
    payment.amount,
    activeLines.map((line) => ({ lineId: line.lineId, amount: line.lineTotal })),
  );

  const lines = await Promise.all(
    (booking.lines ?? []).map(async (line) => {
      const share = shares.find((candidate) => candidate.lineId === line.lineId)?.amount ?? 0;
      const rateBp = line.commissionRateBp ?? rateFor(rateEntries, line.offerType, today);
      if (share === 0) return { ...line, commissionRateBp: rateBp };
      const collectedBefore = previous.docs
        .filter((entry) => entry.lineId === line.lineId)
        .reduce((sum, entry) => sum + entry.grossAmount, 0);
      const entry = collectedEntry({ gross: share, rateBp, previouslyCollected: collectedBefore });
      const partner = line.partner ? relationId(line.partner) : null;
      if (partner !== null) {
        await payload.create({
          collection: 'commissionEntries',
          data: {
            booking: booking.id,
            lineId: line.lineId,
            partner,
            kind: 'collected',
            payment: payment.id,
            grossAmount: entry.grossAmount,
            commissionAmount: entry.commissionAmount,
            partnerAmount: entry.partnerAmount,
            rateBp,
            occurredAt: paidAt.toISOString(),
          },
        });
      }
      return {
        ...line,
        commissionRateBp: rateBp,
        commissionAmount: (line.commissionAmount ?? 0) + entry.commissionAmount,
        partnerAmount: (line.partnerAmount ?? 0) + entry.partnerAmount,
      };
    }),
  );

  const { token, hash } = newManageToken();
  const deadline = availabilityDeadline(paidAt, {
    slaMinutes: settings.checkout.availabilitySlaMinutes,
    businessStart: settings.checkout.businessHoursStart ?? '08:00',
    businessEnd: settings.checkout.businessHoursEnd ?? '20:00',
  });
  const updated = await payload.update({
    collection: 'bookings',
    id: booking.id,
    data: {
      status: nextStatus,
      amountPaid: booking.amountPaid + payment.amount,
      lines,
      availabilityDeadline: booking.availabilityDeadline ?? deadline.toISOString(),
      manageTokenHash: hash,
      voucher: {
        version: (booking.voucher?.version ?? 0) + 1,
        generatedAt: new Date().toISOString(),
      },
    },
  });
  await payload.update({
    collection: 'carts',
    id: relationId(booking.cart),
    data: { status: 'checked_out' },
  });

  const origin = siteUrl();
  const manageUrl = `${origin}${checkoutPath(booking.locale, 'booking', booking.reference)}?k=${token}`;
  await enqueueNotification(payload, {
    template: 'booking_confirmed',
    channel: 'email',
    recipient: booking.traveller.email,
    locale: booking.locale,
    booking: booking.id,
    email: { ...bookingConfirmedEmail(updated, manageUrl), voucherBookingId: booking.id },
  });
  await enqueueNotification(payload, {
    template: 'booking_confirmed',
    channel: 'whatsapp',
    recipient: booking.traveller.whatsapp,
    locale: booking.locale,
    booking: booking.id,
    whatsapp: bookingConfirmedWhatsApp(updated, manageUrl),
  });
  const team = settings.notificationEmail;
  if (team) {
    await enqueueNotification(payload, {
      template: 'team_booking_paid',
      channel: 'email',
      recipient: team,
      locale: 'fr',
      booking: booking.id,
      email: teamBookingEmail(updated, `${origin}/admin/collections/bookings/${booking.id}`),
    });
  }
  return { booking: updated, manageToken: token };
};
