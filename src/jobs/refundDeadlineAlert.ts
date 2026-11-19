import type { Payload } from 'payload';
import { enqueueNotification } from '@/jobs/sendNotification';
import { REFUND_ALERT_DAYS, refundDeadline } from '@/lib/booking/refundRules';
import { teamRefundOverdueEmail } from '@/lib/notifications/templates/refund';
import { siteUrl } from '@/lib/site';

// Alerte des remboursements validés et non versés à J+10 (002, US4, T088 ; FR-029 : versement
// sous 14 jours). Une alerte par remboursement, envoyée à la finance (dédoublonnée par le journal
// `notifications`). Exécutée à chaque passage de /api/jobs/run.

const TEMPLATE = 'team_refund_overdue';
const DAY_MS = 24 * 60 * 60 * 1000;

const relationId = (value: number | { id: number }): number =>
  typeof value === 'number' ? value : value.id;

export const runRefundDeadlineAlert = async (
  payload: Payload,
  now: Date = new Date(),
): Promise<number> => {
  const { docs } = await payload.find({
    collection: 'refunds',
    where: {
      and: [
        { status: { equals: 'approved' } },
        {
          approvedAt: {
            less_than_equal: new Date(now.getTime() - REFUND_ALERT_DAYS * DAY_MS).toISOString(),
          },
        },
      ],
    },
    limit: 50,
    depth: 0,
  });
  if (docs.length === 0) return 0;
  const settings = await payload.findGlobal({ slug: 'siteSettings', depth: 0 });
  const finance = settings.notifications?.financeEmail ?? settings.fallbackNotificationEmail;
  if (!finance) return 0;
  let alerted = 0;
  for (const refund of docs) {
    const bookingId = relationId(refund.booking);
    // Modèle suffixé par l'identifiant du remboursement : une seule alerte par remboursement.
    const template = `${TEMPLATE}:${refund.id}`;
    const already = await payload.count({
      collection: 'notifications',
      where: { template: { equals: template } },
    });
    if (already.totalDocs > 0) continue;
    const booking = await payload.findByID({ collection: 'bookings', id: bookingId, depth: 0 });
    const deadline = new Intl.DateTimeFormat('fr-SN', {
      dateStyle: 'long',
      timeZone: 'UTC',
    }).format(refundDeadline(refund.approvedAt ?? now.toISOString()));
    const email = teamRefundOverdueEmail(
      booking,
      refund.amount,
      deadline,
      `${siteUrl()}/admin/collections/refunds/${refund.id}`,
    );
    await enqueueNotification(payload, {
      template,
      channel: 'email',
      recipient: finance,
      locale: 'fr',
      booking: bookingId,
      email: { ...email, subject: `${email.subject} (remboursement #${refund.id})` },
    });
    alerted += 1;
  }
  return alerted;
};
