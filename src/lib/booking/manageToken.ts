'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { enqueueNotification } from '@/jobs/sendNotification';
import { isLocale, type Locale } from '@/i18n/routing';
import { checkoutPath } from '@/lib/checkout/paths';
import { getPayloadClient } from '@/lib/cms/queries';
import { manageLinkEmail } from '@/lib/notifications/templates/refund';
import { clientIp, consumeRateLimit, hashIp, payloadRateLimitStore } from '@/lib/request/rateLimit';
import { siteUrl } from '@/lib/site';
import { currentManageToken, findBookingByReference } from './access';

// « Retrouver ma réservation » (002, US4, T087 ; contrat checkout-actions « resendManageLink »,
// FR-026) : référence + e-mail → lien de gestion en vigueur envoyé par e-mail. Réponse toujours
// identique, que la paire existe ou non ; 5 demandes par heure et par adresse IP.

const FIND_RATE_LIMIT = 5;
const REFERENCE = /^SE-[A-HJ-NP-Z2-9]{6}$/;

export const resendManageLink = async (formData: FormData): Promise<void> => {
  const localeValue = formData.get('locale');
  const locale: Locale =
    typeof localeValue === 'string' && isLocale(localeValue) ? localeValue : 'fr';
  const page = checkoutPath(locale, 'find');
  // Pot de miel : même réponse, aucun envoi.
  if (formData.get('website')) redirect(`${page}?envoye=1`);

  const payload = await getPayloadClient();
  const allowed = await consumeRateLimit(
    payloadRateLimitStore(payload),
    hashIp(`find:${clientIp(await headers())}`, process.env.RATE_LIMIT_SALT ?? ''),
    new Date(),
    FIND_RATE_LIMIT,
  );
  if (!allowed) redirect(`${page}?limite=1`);

  const reference = String(formData.get('reference') ?? '')
    .trim()
    .toUpperCase();
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const booking = REFERENCE.test(reference)
    ? await findBookingByReference(payload, reference)
    : null;
  const token = booking ? currentManageToken(booking) : null;
  if (booking && token && booking.traveller.email.toLowerCase() === email) {
    const manageUrl = `${siteUrl()}${checkoutPath(booking.locale, 'booking', booking.reference)}?k=${token}`;
    await enqueueNotification(payload, {
      template: 'manage_link',
      channel: 'email',
      recipient: booking.traveller.email,
      locale: booking.locale,
      booking: booking.id,
      email: manageLinkEmail(booking, manageUrl),
    });
  }
  redirect(`${page}?envoye=1`);
};
