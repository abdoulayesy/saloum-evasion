import type { Payload } from 'payload';
import { sendEmail } from '@/lib/request/email';
import { notifyTeam } from '@/lib/request/notify';
import { siteUrl } from '@/lib/site';
import { ALERTED_ATTEMPTS, MAX_NOTIFY_ATTEMPTS, retryAction } from './retryPolicy';

// Relance des notifications de demandes (T146, FR-013) : toutes les 10 minutes, les demandes
// dont l'e-mail à l'équipe n'est pas parti sont renvoyées, 3 essais au plus ; ensuite une seule
// alerte part vers l'adresse de secours des réglages du site, puis la demande n'est plus
// relancée (elle reste signalée « Non notifiée » dans l'admin).

export type RetryResult = { retried: number; sent: number; alerted: number };

export const retryNotifications = async (payload: Payload): Promise<RetryResult> => {
  const pending = await payload.find({
    collection: 'requests',
    where: {
      and: [
        { notifiedAt: { exists: false } },
        { notifyAttempts: { less_than_equal: MAX_NOTIFY_ATTEMPTS } },
      ],
    },
    limit: 100,
    depth: 0,
  });
  const result: RetryResult = { retried: 0, sent: 0, alerted: 0 };
  const settings = await payload.findGlobal({ slug: 'siteSettings', depth: 0 });
  for (const request of pending.docs) {
    const action = retryAction(request);
    if (action === 'retry') {
      result.retried += 1;
      if (await notifyTeam(request.id).catch(() => false)) result.sent += 1;
    }
    if (action === 'alert') {
      const fallback = settings.fallbackNotificationEmail;
      const adminUrl = `${siteUrl()}/admin/collections/requests/${request.id}`;
      if (fallback) {
        await sendEmail({
          to: fallback,
          subject: `[Alerte] Demande ${request.reference ?? ''} non notifiée`,
          text: `La demande ${request.reference ?? ''} de ${request.firstName} n'a pas pu être envoyée à l'équipe après ${MAX_NOTIFY_ATTEMPTS} essais. Traitez-la directement : ${adminUrl}`,
          html: `<p>La demande <strong>${request.reference ?? ''}</strong> n'a pas pu être envoyée à l'équipe après ${MAX_NOTIFY_ATTEMPTS} essais.</p><p><a href="${adminUrl}">Traiter la demande</a></p>`,
        }).catch(() => false);
      }
      await payload.update({
        collection: 'requests',
        id: request.id,
        data: { notifyAttempts: ALERTED_ATTEMPTS },
      });
      result.alerted += 1;
    }
  }
  return result;
};
