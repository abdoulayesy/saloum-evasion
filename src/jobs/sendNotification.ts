import type { Payload, TaskConfig } from 'payload';
import {
  sendNotificationEmail,
  type EmailContent,
  type SendResult,
} from '@/lib/notifications/email';
import { MAX_ATTEMPTS, nextStep } from '@/lib/notifications/retry';
import { renderBookingVoucher } from '@/lib/voucher/render';
import { sendWhatsAppTemplate, type WhatsAppTemplate } from '@/lib/notifications/whatsapp';

// Gabarit d'envoi commun (002, T034 ; contracts/notifications.md) : chaque notification est
// journalisée dans `notifications` avec son contenu déjà rendu, puis envoyée par la file de
// Payload. Échec : nouvelle tentative à 1, 5 puis 30 minutes ; après la 4e, `escalated` et alerte
// vers l'adresse de secours des réglages du site.

export const SEND_NOTIFICATION_TASK = 'sendNotification';

type Locale = 'fr' | 'en';

/** E-mail, éventuellement avec le bon de réservation PDF joint (rendu à l'envoi). */
export type NotificationEmail = EmailContent & { voucherBookingId?: number };

export type NotificationContent =
  | { channel: 'email'; email: NotificationEmail }
  | { channel: 'whatsapp'; whatsapp: WhatsAppTemplate };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const emailContentOf = (value: unknown): NotificationEmail | null =>
  isRecord(value) &&
  typeof value.subject === 'string' &&
  typeof value.text === 'string' &&
  typeof value.html === 'string'
    ? {
        subject: value.subject,
        text: value.text,
        html: value.html,
        voucherBookingId:
          typeof value.voucherBookingId === 'number' ? value.voucherBookingId : undefined,
      }
    : null;

const whatsappContentOf = (value: unknown): WhatsAppTemplate | null => {
  if (!isRecord(value) || typeof value.name !== 'string' || !Array.isArray(value.params))
    return null;
  const params = value.params.filter((param): param is string => typeof param === 'string');
  return { name: value.name, locale: value.locale === 'en' ? 'en' : 'fr', params };
};

/** Journalise une notification et la place dans la file d'envoi immédiat. */
export const enqueueNotification = async (
  payload: Payload,
  input: {
    template: string;
    recipient: string;
    locale: Locale;
    booking?: number;
  } & NotificationContent,
): Promise<number> => {
  const content = input.channel === 'email' ? input.email : input.whatsapp;
  const notification = await payload.create({
    collection: 'notifications',
    data: {
      template: input.template,
      channel: input.channel,
      recipient: input.recipient,
      locale: input.locale,
      booking: input.booking,
      payload: content,
      status: 'queued',
      attempts: 0,
    },
  });
  await payload.jobs.queue({
    task: SEND_NOTIFICATION_TASK,
    input: { notificationId: notification.id },
  });
  return notification.id;
};

/** Bon de réservation joint, rendu au moment de l'envoi (toujours à jour). */
const voucherAttachment = async (payload: Payload, bookingId: number | undefined) => {
  if (bookingId === undefined) return undefined;
  const booking = await payload.findByID({ collection: 'bookings', id: bookingId, depth: 0 });
  const pdf = await renderBookingVoucher(payload, bookingId);
  return [{ filename: `${booking.reference}.pdf`, content: pdf }];
};

const deliver = async (
  payload: Payload,
  channel: 'email' | 'whatsapp',
  recipient: string,
  content: unknown,
): Promise<SendResult> => {
  if (channel === 'email') {
    const email = emailContentOf(content);
    if (!email) return { ok: false, error: 'Contenu e-mail invalide.' };
    const { voucherBookingId, ...message } = email;
    return sendNotificationEmail(
      recipient,
      message,
      await voucherAttachment(payload, voucherBookingId),
    );
  }
  const template = whatsappContentOf(content);
  return template
    ? sendWhatsAppTemplate(recipient, template)
    : { ok: false, error: 'Modèle WhatsApp invalide.' };
};

const escalate = async (
  payload: Payload,
  notification: { id: number; template: string; channel: string },
) => {
  const settings = await payload.findGlobal({ slug: 'siteSettings', depth: 0 });
  const fallback = settings.fallbackNotificationEmail;
  if (!fallback) return;
  await sendNotificationEmail(fallback, {
    subject: `[Alerte] Notification non délivrée (${notification.template}, ${notification.channel})`,
    text: `La notification n° ${notification.id} n’a pas pu être envoyée après ${MAX_ATTEMPTS} tentatives. Voir l’admin : Ventes › Notifications envoyées.`,
    html: `<p>La notification n° ${notification.id} n’a pas pu être envoyée après ${MAX_ATTEMPTS} tentatives.</p><p>Voir l’admin : Ventes › Notifications envoyées.</p>`,
  });
};

/** Une tentative d'envoi ; reprogramme ou escalade en cas d'échec. */
export const runNotificationAttempt = async (
  payload: Payload,
  notificationId: number,
): Promise<void> => {
  const notification = await payload.findByID({
    collection: 'notifications',
    id: notificationId,
    depth: 0,
  });
  if (notification.status === 'sent' || notification.status === 'escalated') return;
  const attempts = (notification.attempts ?? 0) + 1;
  const result = await deliver(
    payload,
    notification.channel,
    notification.recipient,
    notification.payload,
  );
  if (result.ok) {
    await payload.update({
      collection: 'notifications',
      id: notificationId,
      data: {
        status: 'sent',
        attempts,
        providerMessageId: result.providerMessageId,
        lastError: null,
      },
    });
    return;
  }
  const step = nextStep(attempts);
  await payload.update({
    collection: 'notifications',
    id: notificationId,
    data: {
      status: step.action === 'retry' ? 'failed' : 'escalated',
      attempts,
      lastError: result.error,
    },
  });
  if (step.action === 'retry') {
    await payload.jobs.queue({
      task: SEND_NOTIFICATION_TASK,
      input: { notificationId },
      waitUntil: new Date(Date.now() + step.delayMs),
    });
    return;
  }
  await escalate(payload, notification);
};

export const sendNotificationTask: TaskConfig<{
  input: { notificationId: number };
  output: object;
}> = {
  slug: SEND_NOTIFICATION_TASK,
  label: 'Envoi d’une notification (e-mail ou WhatsApp)',
  inputSchema: [{ name: 'notificationId', type: 'number', required: true }],
  // Les relances sont gérées par la politique 0/1/5/30 min, pas par la file.
  retries: 0,
  handler: async ({ input, req }) => {
    await runNotificationAttempt(req.payload, input.notificationId);
    return { output: {} };
  },
};
