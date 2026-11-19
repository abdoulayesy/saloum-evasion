import type {
  CollectionAfterChangeHook,
  CollectionBeforeChangeHook,
  Payload,
  PayloadRequest,
} from 'payload';
import { enqueueNotification } from '@/jobs/sendNotification';
import { trackServer } from '@/lib/analyticsServer';
import { checkoutPath } from '@/lib/checkout/paths';
import { assertBookingTransition, canTransitionBooking } from '@/lib/checkout/stateMachines';
import {
  cancellationReceivedEmail,
  cancellationReceivedWhatsApp,
  refundStatusEmail,
  refundStatusWhatsApp,
  teamCancellationEmail,
  type TravellerRefundStatus,
} from '@/lib/notifications/templates/refund';
import { getPaymentGateway } from '@/lib/payments';
import { siteUrl } from '@/lib/site';
import type { Booking, Refund } from '@/payload-types';
import { currentManageToken } from './access';
import {
  bookingStatusAfterRefund,
  bookingStatusAfterRejection,
  refundAdjustmentEntries,
} from './refundRules';

// Workflow des remboursements (002, US4, T086 ; research R14, FR-027 à FR-030, FR-035) :
// - création (voyageur ou équipe) → réservation `cancellation_requested`, accusé au voyageur
//   (demande du voyageur), avis à la finance ;
// - `approved` → date et auteur de la validation ; moyen d'origine : remboursement demandé à la
//   passerelle, versé aussitôt s'il est accepté ; sinon versement manuel par la finance ;
// - `paid` → lignes annulées, encaissé réduit, écritures d'ajustement de commission, réservation
//   annulée ou partiellement annulée ;
// - `rejected` → la réservation retrouve son statut précédent.
// Le voyageur est notifié à chaque changement de statut (FR-028).

const relationId = (value: number | { id: number }): number =>
  typeof value === 'number' ? value : value.id;

const manageUrlOf = (booking: Booking): string => {
  const token = currentManageToken(booking);
  const path = checkoutPath(booking.locale, 'booking', booking.reference);
  return `${siteUrl()}${path}${token ? `?k=${token}` : ''}`;
};

const loadBooking = (payload: Payload, refund: Refund, req: PayloadRequest): Promise<Booking> =>
  payload.findByID({
    collection: 'bookings',
    id: relationId(refund.booking),
    depth: 0,
    showHiddenFields: true,
    req,
  });

const notifyTraveller = async (
  payload: Payload,
  booking: Booking,
  refund: Refund,
  status: TravellerRefundStatus,
  req: PayloadRequest,
) => {
  const manageUrl = manageUrlOf(booking);
  const details = { status, amount: refund.amount, rejectionReason: refund.rejectionReason };
  await enqueueNotification(
    payload,
    {
      template: 'refund_status',
      channel: 'email',
      recipient: booking.traveller.email,
      locale: booking.locale,
      booking: booking.id,
      email: refundStatusEmail(booking, details, manageUrl),
    },
    req,
  );
  await enqueueNotification(
    payload,
    {
      template: 'refund_status',
      channel: 'whatsapp',
      recipient: booking.traveller.whatsapp,
      locale: booking.locale,
      booking: booking.id,
      whatsapp: refundStatusWhatsApp(booking, details, manageUrl),
    },
    req,
  );
};

const onCreated = async (payload: Payload, refund: Refund, req: PayloadRequest) => {
  const booking = await loadBooking(payload, refund, req);
  if (canTransitionBooking(booking.status, 'cancellation_requested')) {
    await payload.update({
      collection: 'bookings',
      id: booking.id,
      data: { status: 'cancellation_requested' },
      req,
    });
  }
  if (refund.reason === 'traveller') {
    const manageUrl = manageUrlOf(booking);
    await enqueueNotification(
      payload,
      {
        template: 'cancellation_received',
        channel: 'email',
        recipient: booking.traveller.email,
        locale: booking.locale,
        booking: booking.id,
        email: cancellationReceivedEmail(booking, refund.amount, manageUrl),
      },
      req,
    );
    await enqueueNotification(
      payload,
      {
        template: 'cancellation_received',
        channel: 'whatsapp',
        recipient: booking.traveller.whatsapp,
        locale: booking.locale,
        booking: booking.id,
        whatsapp: cancellationReceivedWhatsApp(booking, refund.amount, manageUrl),
      },
      req,
    );
  }
  const settings = await payload.findGlobal({ slug: 'siteSettings', depth: 0, req });
  const finance = settings.notifications?.financeEmail ?? settings.fallbackNotificationEmail;
  if (finance) {
    await enqueueNotification(
      payload,
      {
        template: 'team_cancellation_requested',
        channel: 'email',
        recipient: finance,
        locale: 'fr',
        booking: booking.id,
        email: teamCancellationEmail(
          booking,
          refund.amount,
          `${siteUrl()}/admin/collections/refunds/${refund.id}`,
        ),
      },
      req,
    );
  }
  await trackServer('cancellation_requested', {
    reason: refund.reason,
    lines: (refund.lines ?? []).length,
  });
};

/**
 * Remboursement sur le moyen d'origine : réparti sur les paiements réussis, du plus récent au
 * plus ancien. Renvoie les références de la passerelle, ou `null` si elle ne peut pas le faire
 * (remboursement manuel par la finance, R14).
 */
const refundThroughGateway = async (
  payload: Payload,
  refund: Refund,
  req: PayloadRequest,
): Promise<string | null> => {
  const gateway = getPaymentGateway();
  const { docs } = await payload.find({
    collection: 'payments',
    where: {
      and: [
        { booking: { equals: relationId(refund.booking) } },
        { status: { equals: 'succeeded' } },
        { gateway: { equals: gateway.id } },
      ],
    },
    sort: '-createdAt',
    limit: 10,
    depth: 0,
    req,
  });
  let remaining = refund.amount;
  const references: string[] = [];
  for (const payment of docs) {
    if (remaining <= 0) break;
    if (!payment.gatewayReference) continue;
    const portion = Math.min(remaining, payment.amount);
    const result = await gateway.refund(payment.gatewayReference, portion);
    if (!result.ok) return null;
    references.push(result.gatewayRefundReference);
    remaining -= portion;
  }
  return remaining === 0 ? references.join(', ') : null;
};

const onApproved = async (payload: Payload, refund: Refund, req: PayloadRequest) => {
  const booking = await loadBooking(payload, refund, req);
  await notifyTraveller(payload, booking, refund, 'approved', req);
  // Rien à verser (annulation au palier 0 %) : versé aussitôt.
  const reference =
    refund.amount === 0
      ? ''
      : refund.method === 'original'
        ? await refundThroughGateway(payload, refund, req)
        : null;
  if (reference === null) return;
  await payload.update({
    collection: 'refunds',
    id: refund.id,
    data: {
      status: 'paid',
      paidAt: new Date().toISOString(),
      ...(reference ? { gatewayRefundReference: reference } : {}),
    },
    req,
  });
};

const onPaid = async (payload: Payload, refund: Refund, req: PayloadRequest) => {
  const booking = await loadBooking(payload, refund, req);
  const refundLines = (refund.lines ?? []).map((line) => ({
    lineId: line.lineId,
    amount: line.amount,
  }));
  const bookingLines = (booking.lines ?? []).map((line) => ({
    lineId: line.lineId,
    lineTotal: line.lineTotal,
    cancelled: line.cancelled,
    commissionRateBp: line.commissionRateBp,
    partner: line.partner ? relationId(line.partner) : null,
  }));
  const occurredAt = refund.paidAt ?? new Date().toISOString();
  for (const entry of refundAdjustmentEntries({
    refundLines,
    bookingLines,
    reason: refund.reason,
  })) {
    if (entry.partner === null) continue;
    await payload.create({
      collection: 'commissionEntries',
      data: {
        booking: booking.id,
        lineId: entry.lineId,
        partner: entry.partner,
        kind: 'refund_adjustment',
        refund: refund.id,
        grossAmount: entry.grossAmount,
        commissionAmount: entry.commissionAmount,
        partnerAmount: entry.partnerAmount,
        rateBp: entry.rateBp,
        occurredAt,
      },
      req,
    });
  }
  // Une ligne remplacée par une alternative (écart de prix remboursé, T089) reste active.
  const replaced = new Set(
    (booking.lines ?? [])
      .filter((line) => line.availabilityStatus === 'replaced')
      .map((line) => line.lineId),
  );
  const cancelledIds = refundLines
    .map((line) => line.lineId)
    .filter((lineId) => !replaced.has(lineId));
  const cancelledSet = new Set(cancelledIds);
  const amountPaid = Math.max(0, booking.amountPaid - refund.amount);
  const nextStatus =
    cancelledIds.length > 0
      ? bookingStatusAfterRefund({ bookingLines, refundedLineIds: cancelledIds })
      : bookingStatusAfterRejection({ amountPaid, total: booking.total });
  if (booking.status !== nextStatus) assertBookingTransition(booking.status, nextStatus);
  await payload.update({
    collection: 'bookings',
    id: booking.id,
    data: {
      status: nextStatus,
      amountPaid,
      lines: (booking.lines ?? []).map((line) =>
        cancelledSet.has(line.lineId) ? { ...line, cancelled: true } : line,
      ),
    },
    req,
  });
  await notifyTraveller(payload, booking, refund, 'paid', req);
};

const onRejected = async (payload: Payload, refund: Refund, req: PayloadRequest) => {
  const booking = await loadBooking(payload, refund, req);
  if (booking.status === 'cancellation_requested') {
    await payload.update({
      collection: 'bookings',
      id: booking.id,
      data: { status: bookingStatusAfterRejection(booking) },
      req,
    });
  }
  await notifyTraveller(payload, booking, refund, 'rejected', req);
};

/** Date et auteur de la validation, date de versement (suivi du délai de 14 jours). */
export const stampRefund: CollectionBeforeChangeHook<Refund> = ({ data, originalDoc, req }) => {
  const previous = originalDoc?.status;
  if (data.status === 'approved' && previous !== 'approved') {
    data.approvedAt ??= new Date().toISOString();
    if (req.user && 'role' in req.user) data.approvedBy ??= req.user.id;
  }
  if (data.status === 'paid' && previous !== 'paid') {
    data.paidAt ??= new Date().toISOString();
    data.approvedAt ??= originalDoc?.approvedAt ?? new Date().toISOString();
  }
  return data;
};

export const refundWorkflow: CollectionAfterChangeHook<Refund> = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  const { payload } = req;
  if (operation === 'create') {
    await onCreated(payload, doc, req);
    return doc;
  }
  if (doc.status === previousDoc.status) return doc;
  if (doc.status === 'approved') await onApproved(payload, doc, req);
  if (doc.status === 'paid') await onPaid(payload, doc, req);
  if (doc.status === 'rejected') await onRejected(payload, doc, req);
  return doc;
};
