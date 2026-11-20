import type { Payload } from 'payload';
import { trackServer } from '@/lib/analyticsServer';
import { applySuccessfulPayment } from '@/lib/booking/applyPayment';
import { durationBucket } from '@/lib/checkout/funnel';
import { sendNotificationEmail } from '@/lib/notifications/email';
import type { NotifyPayment, NotifyStore } from './notify';

// Stockage Payload du traitement des notifications (002, T056) : journal `paymentEvents`
// (identifiant d'évènement unique), tentatives `payments`, effets métier du succès.

const isUniqueViolation = (error: unknown): boolean =>
  error instanceof Error &&
  /unique|duplicate/i.test(`${error.message} ${String(error.cause ?? '')}`);

const toNotifyPayment = (doc: {
  id: number;
  status: NotifyPayment['status'];
  amount: number;
  currency: string;
  gatewayReference?: string | null;
}): NotifyPayment => ({
  id: doc.id,
  status: doc.status,
  amount: doc.amount,
  currency: doc.currency,
  gatewayReference: doc.gatewayReference,
});

export const payloadNotifyStore = (payload: Payload): NotifyStore => ({
  recordEvent: async ({ gatewayEventId, type, payload: body, signatureValid, paymentId }) => {
    try {
      await payload.create({
        collection: 'paymentEvents',
        data: {
          gatewayEventId,
          type,
          payload: JSON.parse(JSON.stringify(body)),
          signatureValid,
          payment: paymentId,
          receivedAt: new Date().toISOString(),
        },
      });
      return 'recorded';
    } catch (error) {
      if (isUniqueViolation(error)) return 'duplicate';
      throw error;
    }
  },
  findPayment: async (gatewayReference, idempotencyKey) => {
    const { docs } = await payload.find({
      collection: 'payments',
      where: idempotencyKey
        ? {
            or: [
              { gatewayReference: { equals: gatewayReference } },
              { idempotencyKey: { equals: idempotencyKey } },
            ],
          }
        : { gatewayReference: { equals: gatewayReference } },
      limit: 1,
      depth: 0,
    });
    const doc = docs[0];
    return doc ? toNotifyPayment(doc) : null;
  },
  updatePayment: async (id, data) => {
    const updated = await payload.update({ collection: 'payments', id, data });
    // Entonnoir par langue et par moyen (FR-040) : échecs et abandons (page de paiement quittée,
    // délai expiré).
    if (data.status !== 'failed' && data.status !== 'abandoned' && data.status !== 'expired')
      return;
    const booking = await payload.findByID({
      collection: 'bookings',
      id: typeof updated.booking === 'number' ? updated.booking : updated.booking.id,
      depth: 0,
      select: { locale: true },
    });
    if (data.status === 'failed') {
      await trackServer('payment_failed', {
        method: updated.method,
        reason: data.failureReason ?? 'technical',
        locale: booking.locale,
      });
    } else {
      await trackServer('payment_abandoned', {
        method: updated.method,
        status: data.status,
        locale: booking.locale,
      });
    }
  },
  onSucceeded: async (payment, paidAt) => {
    const { booking } = await applySuccessfulPayment(payload, payment.id, paidAt);
    const method = (await payload.findByID({ collection: 'payments', id: payment.id, depth: 0 }))
      .method;
    const locale = booking.locale;
    await trackServer('payment_succeeded', { method, locale });
    // Durée du parcours (FR-040) : de la création du panier au paiement confirmé.
    const cartId = typeof booking.cart === 'number' ? booking.cart : booking.cart.id;
    const cart = await payload.findByID({ collection: 'carts', id: cartId, depth: 0 });
    const durationSeconds = Math.max(
      0,
      Math.round((paidAt.getTime() - new Date(cart.createdAt).getTime()) / 1000),
    );
    await trackServer('checkout_completed', {
      method,
      locale,
      durationSeconds,
      duration: durationBucket(durationSeconds),
    });
    // Paiement après une relance dont le lien a été ouvert (US3, T081, SC-005).
    const { docs: opened } = await payload.find({
      collection: 'reminders',
      where: {
        and: [
          { targetType: { equals: 'carts' } },
          { targetId: { equals: cartId } },
          { linkOpenedAt: { exists: true } },
        ],
      },
      sort: '-linkOpenedAt',
      limit: 1,
      depth: 0,
    });
    const recovered = opened[0];
    if (recovered) {
      await trackServer('payment_recovered', {
        method,
        locale,
        channel: recovered.channel,
        rank: recovered.rank,
      });
    }
  },
  alertAnomaly: async (payment, detail) => {
    const settings = await payload.findGlobal({ slug: 'siteSettings', depth: 0 });
    const to = settings.notifications?.financeEmail ?? settings.fallbackNotificationEmail;
    if (!to) {
      payload.logger.error(`[paiement ${payment.id}] anomalie : ${detail}`);
      return;
    }
    await sendNotificationEmail(to, {
      subject: `[Anomalie de paiement] tentative n° ${payment.id}`,
      text: `${detail}\nLa réservation n'a pas été modifiée. Vérifier auprès de l'agrégateur.`,
      html: `<p>${detail}</p><p>La réservation n'a pas été modifiée. Vérifier auprès de l'agrégateur.</p>`,
    });
  },
});
