'use server';

import { redirect } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/routing';
import { todayInDakar } from '@/lib/cart/validate';
import { checkoutPath } from '@/lib/checkout/paths';
import { getPayloadClient } from '@/lib/cms/queries';
import { canAccessBooking, findBookingByReference } from './access';
import { canRequestCancellation, cancellationQuote } from './cancellationQuote';

// Demande d'annulation (002, US4, T085 ; contrat checkout-actions « requestCancellation ») : le
// montant a été affiché par la page serveur ; l'action le recalcule à l'identique et enregistre
// la demande (`refunds` au statut `requested`). Le workflow (statut de la réservation, accusé au
// voyageur, avis à la finance) est porté par les hooks de la collection.

const REFERENCE = /^SE-[A-HJ-NP-Z2-9]{6}$/;

export const requestCancellation = async (formData: FormData): Promise<void> => {
  const localeValue = formData.get('locale');
  const locale: Locale =
    typeof localeValue === 'string' && isLocale(localeValue) ? localeValue : 'fr';
  const reference = String(formData.get('bookingRef') ?? '');
  const token = String(formData.get('k') ?? '') || null;
  const tokenQuery = token ? `k=${encodeURIComponent(token)}` : '';
  if (!REFERENCE.test(reference)) redirect(checkoutPath(locale, 'find'));
  const cancelPage = `${checkoutPath(locale, 'cancel', reference)}?${tokenQuery}`;
  // Annotation explicite : TypeScript ne restreint les types après un appel qu'à cette condition.
  const back: (error: string) => never = (error) => redirect(`${cancelPage}&erreur=${error}`);

  const payload = await getPayloadClient();
  const booking = await findBookingByReference(payload, reference);
  if (!booking || !(await canAccessBooking(payload, booking, token))) back('acces');
  const bookingPage = `${checkoutPath(locale, 'booking', booking.reference)}${tokenQuery ? `?${tokenQuery}` : ''}`;
  if (!canRequestCancellation(booking)) redirect(bookingPage);
  if (formData.get('confirm') !== 'on') back('confirmation');

  const selected = new Set(formData.getAll('lineIds').map(String));
  const quote = cancellationQuote(booking, todayInDakar()).filter((line) =>
    selected.has(line.lineId),
  );
  if (quote.length === 0) back('lignes');
  const amount = quote.reduce((sum, line) => sum + line.amount, 0);
  await payload.create({
    collection: 'refunds',
    data: {
      booking: booking.id,
      lines: quote.map((line) => ({ lineId: line.lineId, amount: line.amount })),
      amount,
      calculatedAmount: amount,
      reason: 'traveller',
      method: 'original',
      status: 'requested',
    },
  });
  redirect(`${bookingPage}${tokenQuery ? '&' : '?'}annulation=demandee`);
};
