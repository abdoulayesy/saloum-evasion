import type { Payload } from 'payload';
import { enqueueNotification } from '@/jobs/sendNotification';
import { currentManageToken } from '@/lib/booking/access';
import { dueBalanceReminder, type BalanceReminderStep } from '@/lib/checkout/balanceSchedule';
import { addDays } from '@/lib/checkout/deposit';
import { checkoutPath } from '@/lib/checkout/paths';
import {
  balanceReminderEmail,
  balanceReminderWhatsApp,
  teamBalanceOverdueEmail,
} from '@/lib/notifications/templates/balance';
import { siteUrl } from '@/lib/site';
import type { Booking } from '@/payload-types';

// Rappels du solde (002, US2, T071 ; FR-017) : lien de paiement du solde à J-21 puis la veille
// de la date limite, dernier rappel et alerte de l'équipe à la date limite, sans annulation
// automatique. Chaque relance est d'abord inscrite au journal `reminders` (index unique cible +
// type + canal + rang) : deux passages simultanés n'envoient jamais deux fois le même rappel.
// Exécutée à chaque passage de /api/jobs/run.

const BATCH = 100;

type Channel = 'email' | 'whatsapp';

const todayOf = (now: Date): string => now.toISOString().slice(0, 10);

/** Inscrit la relance ; `false` si elle l'est déjà (index unique). */
const claimReminder = async (
  payload: Payload,
  booking: Booking,
  step: BalanceReminderStep,
  channel: Channel,
  now: Date,
): Promise<boolean> => {
  try {
    await payload.create({
      collection: 'reminders',
      data: {
        targetType: 'bookings',
        targetId: booking.id,
        kind: step.kind,
        channel,
        rank: step.rank,
        scheduledFor: `${step.scheduledFor}T00:00:00.000Z`,
        sentAt: now.toISOString(),
        status: 'sent',
      },
    });
    return true;
  } catch {
    return false;
  }
};

const remind = async (
  payload: Payload,
  booking: Booking,
  step: BalanceReminderStep,
  now: Date,
  teamEmail: string | null,
): Promise<void> => {
  const token = currentManageToken(booking);
  const origin = siteUrl();
  if (token) {
    const balanceUrl = `${origin}${checkoutPath(booking.locale, 'balance', booking.reference)}?k=${token}`;
    if (await claimReminder(payload, booking, step, 'email', now)) {
      await enqueueNotification(payload, {
        template: step.kind,
        channel: 'email',
        recipient: booking.traveller.email,
        locale: booking.locale,
        booking: booking.id,
        email: balanceReminderEmail(booking, balanceUrl, step.kind),
      });
    }
    if (await claimReminder(payload, booking, step, 'whatsapp', now)) {
      await enqueueNotification(payload, {
        template: step.kind,
        channel: 'whatsapp',
        recipient: booking.traveller.whatsapp,
        locale: booking.locale,
        booking: booking.id,
        whatsapp: balanceReminderWhatsApp(booking, balanceUrl),
      });
    }
  }
  if (step.kind !== 'balance_overdue' || !teamEmail) return;
  const already = await payload.count({
    collection: 'notifications',
    where: {
      and: [{ booking: { equals: booking.id } }, { template: { equals: 'team_balance_overdue' } }],
    },
  });
  if (already.totalDocs > 0) return;
  await enqueueNotification(payload, {
    template: 'team_balance_overdue',
    channel: 'email',
    recipient: teamEmail,
    locale: 'fr',
    booking: booking.id,
    email: teamBalanceOverdueEmail(booking, `${origin}/admin/collections/bookings/${booking.id}`),
  });
};

/** Envoie les rappels du solde échus ; renvoie le nombre de réservations relancées. */
export const runBalanceReminders = async (
  payload: Payload,
  now: Date = new Date(),
): Promise<number> => {
  const today = todayOf(now);
  const settings = await payload.findGlobal({ slug: 'siteSettings', depth: 0 });
  const teamEmail = settings.notificationEmail ?? settings.fallbackNotificationEmail ?? null;
  let reminded = 0;
  // Première étape à J-7 de la date limite : seules les réservations dans cette fenêtre comptent.
  // Toutes les pages sont parcourues : un solde en retard reste `deposit_paid` jusqu'à la
  // décision de l'équipe et ne doit pas masquer les réservations suivantes.
  for (let page = 1, hasNextPage = true; hasNextPage; page += 1) {
    const result = await payload.find({
      collection: 'bookings',
      where: {
        and: [
          { status: { equals: 'deposit_paid' } },
          { paymentPlan: { equals: 'deposit' } },
          { balanceDueDate: { less_than_equal: `${addDays(today, 7)}T23:59:59.999Z` } },
        ],
      },
      sort: 'id',
      page,
      limit: BATCH,
      depth: 0,
      showHiddenFields: true,
    });
    hasNextPage = result.hasNextPage;
    reminded += await remindPage(payload, result.docs, today, now, teamEmail);
  }
  return reminded;
};

const remindPage = async (
  payload: Payload,
  docs: Booking[],
  today: string,
  now: Date,
  teamEmail: string | null,
): Promise<number> => {
  let reminded = 0;
  for (const booking of docs) {
    const sent = await payload.find({
      collection: 'reminders',
      where: {
        and: [
          { targetType: { equals: 'bookings' } },
          { targetId: { equals: booking.id } },
          { kind: { in: ['balance_due', 'balance_overdue'] } },
        ],
      },
      limit: 20,
      depth: 0,
    });
    const step = dueBalanceReminder({
      status: booking.status,
      paymentPlan: booking.paymentPlan,
      balanceDueDate: booking.balanceDueDate?.slice(0, 10) ?? null,
      today,
      sent: sent.docs.map((entry) => ({ kind: entry.kind, rank: entry.rank })),
    });
    if (!step) continue;
    await remind(payload, booking, step, now, teamEmail);
    reminded += 1;
  }
  return reminded;
};
