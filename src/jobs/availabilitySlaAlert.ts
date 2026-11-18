import type { Payload } from 'payload';
import { enqueueNotification } from '@/jobs/sendNotification';

// Alerte de dépassement de l'échéance de confirmation de disponibilité (002, T063, FR-005) :
// réservations payées dont `availabilityDeadline` est passée avec des lignes encore « à
// confirmer ». Une alerte par réservation (dédoublonnée par le journal `notifications`).
// Exécutée à chaque passage de /api/jobs/run.

const TEMPLATE = 'availability_sla_alert';

export const runAvailabilitySlaCheck = async (
  payload: Payload,
  now: Date = new Date(),
): Promise<number> => {
  const settings = await payload.findGlobal({ slug: 'siteSettings', depth: 0 });
  const to = settings.notificationEmail ?? settings.fallbackNotificationEmail;
  if (!to) return 0;
  const { docs } = await payload.find({
    collection: 'bookings',
    where: {
      and: [
        { status: { in: ['paid', 'deposit_paid'] } },
        { availabilityDeadline: { less_than: now.toISOString() } },
      ],
    },
    limit: 50,
    depth: 0,
  });
  let alerted = 0;
  for (const booking of docs) {
    const pending = (booking.lines ?? []).filter(
      (line) => !line.cancelled && line.availabilityStatus === 'pending',
    );
    if (pending.length === 0) continue;
    const already = await payload.count({
      collection: 'notifications',
      where: { and: [{ booking: { equals: booking.id } }, { template: { equals: TEMPLATE } }] },
    });
    if (already.totalDocs > 0) continue;
    const titles = pending.map((line) => line.title).join(', ');
    await enqueueNotification(payload, {
      template: TEMPLATE,
      channel: 'email',
      recipient: to,
      locale: 'fr',
      booking: booking.id,
      email: {
        subject: `[Disponibilité en retard] ${booking.reference}`,
        text: `L'échéance de confirmation est dépassée pour ${booking.reference} : ${titles}. Confirmer ou signaler l'indisponibilité dans l'admin.`,
        html: `<p>L'échéance de confirmation est dépassée pour <strong>${booking.reference}</strong> : ${titles}.</p><p>Confirmer ou signaler l'indisponibilité dans l'admin.</p>`,
      },
    });
    alerted += 1;
  }
  return alerted;
};
