import type { Payload } from 'payload';
import { enqueueNotification } from '@/jobs/sendNotification';
import { checkoutPath } from '@/lib/checkout/paths';
import { isFailureReason, type FailureReason } from '@/lib/payments/gateway';
import {
  paymentReminderEmail,
  paymentReminderWhatsApp,
} from '@/lib/notifications/templates/reminder';
import { siteUrl } from '@/lib/site';
import type { Booking, Cart } from '@/payload-types';
import { createReminderLinkToken, type ReminderSource } from './reminderLink';

// Envoi d'une relance de paiement (002, US3, T078 et T080) : lien de reprise signé (7 jours) et
// lien de désinscription, par e-mail et WhatsApp. Utilisé par la tâche des relances (rangs 1
// et 2) et par l'action « Renvoyer un lien de paiement » de l'admin (source `team`).

export const reminderUrls = (cart: Pick<Cart, 'id' | 'locale'>, source: ReminderSource) => {
  const origin = siteUrl();
  const resume = createReminderLinkToken('resume', cart.id, source);
  const unsubscribe = createReminderLinkToken('unsubscribe', cart.id, source);
  return {
    resumeUrl: `${origin}${checkoutPath(cart.locale, 'resume')}?t=${resume}`,
    unsubscribeUrl: `${origin}${checkoutPath(cart.locale, 'unsubscribe')}?t=${unsubscribe}`,
  };
};

/** Cause du dernier échec de paiement de la réservation, s'il y en a eu un. */
export const lastFailureReason = async (
  payload: Payload,
  bookingId: number,
): Promise<FailureReason | null> => {
  const { docs } = await payload.find({
    collection: 'payments',
    where: { booking: { equals: bookingId } },
    sort: '-createdAt',
    limit: 1,
    depth: 0,
  });
  const last = docs[0];
  return last?.status === 'failed' && isFailureReason(last.failureReason)
    ? last.failureReason
    : null;
};

type Channel = 'email' | 'whatsapp';

/** Relance automatique (rang 1 ou 2) ou lien renvoyé par l'équipe. */
export type ReminderOrigin = { kind: 'reminder'; rank: 1 | 2 } | { kind: 'team' };

const sourceFor = (origin: ReminderOrigin, channel: Channel): ReminderSource =>
  origin.kind === 'team' ? origin : { kind: 'reminder', channel, rank: origin.rank };

export const sendPaymentReminder = async (
  payload: Payload,
  {
    booking,
    cart,
    origin,
    channels,
  }: { booking: Booking; cart: Cart; origin: ReminderOrigin; channels: readonly Channel[] },
): Promise<void> => {
  const failureReason = await lastFailureReason(payload, booking.id);
  for (const channel of channels) {
    // Un lien par canal : l'ouverture et la récupération sont attribuées au bon message (T081).
    const input = { booking, failureReason, ...reminderUrls(cart, sourceFor(origin, channel)) };
    if (channel === 'email') {
      await enqueueNotification(payload, {
        template: 'payment_failed_reminder',
        channel,
        recipient: booking.traveller.email,
        locale: booking.locale,
        booking: booking.id,
        email: paymentReminderEmail(input),
      });
    } else {
      await enqueueNotification(payload, {
        template: 'payment_failed_reminder',
        channel,
        recipient: booking.traveller.whatsapp,
        locale: booking.locale,
        booking: booking.id,
        whatsapp: paymentReminderWhatsApp(input),
      });
    }
  }
};
