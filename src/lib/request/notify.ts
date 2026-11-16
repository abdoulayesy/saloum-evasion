import { getPayloadClient } from '@/lib/cms/queries';
import { absoluteUrl, siteUrl } from '@/lib/site';
import { buildRequestEmail, sendEmail } from './email';

// Notification de l'équipe pour une demande (T141, T146) : module serveur ordinaire, jamais
// exposé comme Server Action (sinon appelable depuis le navigateur).

/** Envoie l'e-mail de la demande et met à jour `notifiedAt` / `notifyAttempts`. */
export const notifyTeam = async (requestId: number): Promise<boolean> => {
  const payload = await getPayloadClient();
  const request = await payload.findByID({ collection: 'requests', id: requestId, depth: 0 });
  const settings = await payload.findGlobal({ slug: 'siteSettings', depth: 0 });
  const to = settings.notificationEmail;
  const attempts = (request.notifyAttempts ?? 0) + 1;
  const sent = to
    ? await sendEmail(
        buildRequestEmail(
          {
            reference: request.reference ?? '',
            firstName: request.firstName,
            whatsapp: request.whatsapp,
            email: request.email ?? undefined,
            arrivalDate: request.arrivalDate.slice(0, 10),
            departureDate: request.departureDate?.slice(0, 10),
            adults: request.adults,
            children: request.children ?? 0,
            moods: request.moods ?? [],
            budgetBand: request.budgetBand ?? undefined,
            message: request.message ?? undefined,
            items: (request.items ?? []).map((item) => ({
              kind: item.kind,
              title: item.titleSnapshot,
            })),
            locale: request.locale,
            sourceUrl: absoluteUrl(request.sourcePath ?? '/'),
            adminUrl: `${siteUrl()}/admin/collections/requests/${request.id}`,
          },
          to,
        ),
      )
    : false;
  await payload.update({
    collection: 'requests',
    id: requestId,
    data: { notifyAttempts: attempts, ...(sent ? { notifiedAt: new Date().toISOString() } : {}) },
  });
  return sent;
};
