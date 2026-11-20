'use server';

import { redirect } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/routing';
import { checkoutPath } from '@/lib/checkout/paths';
import { getPayloadClient } from '@/lib/cms/queries';
import { canAccessBooking, findBookingByReference } from './access';
import type { TravellerChoice } from './availability';
import { applyUnavailableChoice } from './unavailableChoice';

// Choix du voyageur pour une prestation indisponible (002, US4, T089, FR-005) : formulaire de la
// page de la réservation (jeton ou cookie du panier), une alternative ou le remboursement
// intégral, en un geste.

const REFERENCE = /^SE-[A-HJ-NP-Z2-9]{6}$/;
const CHOICES: readonly TravellerChoice[] = ['alternative_1', 'alternative_2', 'refund'];

const isChoice = (value: unknown): value is TravellerChoice =>
  CHOICES.some((choice) => choice === value);

export const chooseForUnavailable = async (formData: FormData): Promise<void> => {
  const localeValue = formData.get('locale');
  const locale: Locale =
    typeof localeValue === 'string' && isLocale(localeValue) ? localeValue : 'fr';
  const reference = String(formData.get('bookingRef') ?? '');
  const token = String(formData.get('k') ?? '') || null;
  if (!REFERENCE.test(reference)) redirect(checkoutPath(locale, 'find'));
  const bookingPage = `${checkoutPath(locale, 'booking', reference)}${token ? `?k=${encodeURIComponent(token)}` : ''}`;
  const choice = formData.get('choice');
  const lineId = String(formData.get('lineId') ?? '');

  const payload = await getPayloadClient();
  const booking = await findBookingByReference(payload, reference);
  if (!booking || !(await canAccessBooking(payload, booking, token)) || !isChoice(choice)) {
    redirect(bookingPage);
  }
  const applied = await applyUnavailableChoice(payload, booking, lineId, choice);
  redirect(`${bookingPage}${token ? '&' : '?'}choix=${applied ? 'enregistre' : 'impossible'}`);
};
