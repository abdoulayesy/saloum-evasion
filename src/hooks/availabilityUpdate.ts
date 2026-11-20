import type { CollectionAfterChangeHook } from 'payload';
import { enqueueNotification } from '@/jobs/sendNotification';
import { checkoutPath } from '@/lib/checkout/paths';
import {
  availabilityUpdateEmail,
  availabilityUpdateWhatsApp,
} from '@/lib/notifications/templates/availabilityUpdate';
import { siteUrl } from '@/lib/site';
import type { Booking } from '@/payload-types';

// Confirmation de disponibilité par l'équipe dans l'admin (002, T062) : quand un membre de
// l'équipe change le statut de disponibilité d'une ligne, le voyageur est prévenu (e-mail et
// WhatsApp) ; quand toutes les lignes sont confirmées, la version du bon PDF augmente (il est
// régénéré à la prochaine lecture). Écritures dans la transaction de la requête (`req`) : hors
// transaction, elles attendraient le verrou de la réservation en cours d'enregistrement.

const SKIP = 'skipAvailabilityHook';

const statuses = (booking: Partial<Booking> | undefined): string =>
  (booking?.lines ?? []).map((line) => `${line.lineId}:${line.availabilityStatus}`).join('|');

export const notifyAvailabilityChange: CollectionAfterChangeHook<Booking> = async ({
  doc,
  previousDoc,
  operation,
  req,
  context,
}) => {
  if (operation !== 'update' || !req.user || context[SKIP]) return doc;
  if (statuses(doc) === statuses(previousDoc)) return doc;
  const { payload } = req;
  const findUrl = `${siteUrl()}${checkoutPath(doc.locale, 'find')}`;
  await enqueueNotification(
    payload,
    {
      template: 'availability_update',
      channel: 'email',
      recipient: doc.traveller.email,
      locale: doc.locale,
      booking: doc.id,
      email: { ...availabilityUpdateEmail(doc, findUrl), voucherBookingId: doc.id },
    },
    req,
  );
  await enqueueNotification(
    payload,
    {
      template: 'availability_update',
      channel: 'whatsapp',
      recipient: doc.traveller.whatsapp,
      locale: doc.locale,
      booking: doc.id,
      whatsapp: availabilityUpdateWhatsApp(doc),
    },
    req,
  );
  const active = (doc.lines ?? []).filter((line) => !line.cancelled);
  if (active.length > 0 && active.every((line) => line.availabilityStatus === 'confirmed')) {
    await payload.update({
      collection: 'bookings',
      id: doc.id,
      data: {
        voucher: {
          version: (doc.voucher?.version ?? 0) + 1,
          generatedAt: new Date().toISOString(),
        },
      },
      context: { [SKIP]: true },
      req,
    });
  }
  return doc;
};
