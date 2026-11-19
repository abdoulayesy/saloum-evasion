'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/routing';
import { loadCartState } from '@/lib/cart/load';
import { formEntries } from '@/lib/cart/schema';
import { isCartPayable } from '@/lib/cart/validate';
import { checkoutPath } from '@/lib/checkout/paths';
import { getPayloadClient } from '@/lib/cms/queries';
import {
  clientIp,
  consumeRateLimit,
  hashIp,
  payloadRateLimitStore,
  requestsPerHour,
} from '@/lib/request/rateLimit';
import { parseContact, type ContactResult, type ContactValues } from './contact';
import { createOrFindBooking } from './createBooking';

// Étape coordonnées (002, T052) : validation serveur, pot de miel, limitation 10 / h / IP,
// revalidation du panier puis création idempotente de la réservation `awaiting_payment`.
// Succès : 303 vers l'étape paiement. Erreurs renvoyées au formulaire (useActionState), qui
// fonctionne aussi sans JavaScript.

const CHECKOUT_RATE_LIMIT = 10;

const localeOf = (formData: FormData): Locale => {
  const value = formData.get('locale');
  return typeof value === 'string' && isLocale(value) ? value : 'fr';
};

const valuesOf = (raw: Record<string, string>): ContactValues => ({
  firstName: raw.firstName,
  lastName: raw.lastName,
  dialCode: raw.dialCode,
  whatsappLocal: raw.whatsappLocal,
  email: raw.email,
  specialRequest: raw.specialRequest,
});

export const submitContactDetails = async (
  _previous: ContactResult | null,
  formData: FormData,
): Promise<ContactResult> => {
  const locale = localeOf(formData);
  const raw = formEntries(formData);
  if (raw.website) return { status: 'error' };

  const payload = await getPayloadClient();
  const salt = process.env.RATE_LIMIT_SALT ?? '';
  const allowed = await consumeRateLimit(
    payloadRateLimitStore(payload),
    hashIp(`checkout:${clientIp(await headers())}`, salt),
    new Date(),
    Math.max(CHECKOUT_RATE_LIMIT, requestsPerHour()),
  );
  if (!allowed) return { status: 'rate_limited', values: valuesOf(raw) };

  const parsed = parseContact(raw);
  if (!parsed.ok) return { status: 'invalid', errors: parsed.errors, values: valuesOf(raw) };

  const state = await loadCartState(payload, locale);
  if (!state.cart || !isCartPayable(state.reviewed)) return { status: 'conflict' };

  const { consentReminders, specialRequest, ...traveller } = parsed.data;
  await payload.update({
    collection: 'carts',
    id: state.cart.id,
    data: { contact: traveller, remindersConsent: consentReminders === 'on', locale },
  });
  await createOrFindBooking(payload, {
    cart: state.cart,
    reviewed: state.reviewed,
    traveller,
    specialRequest,
    locale,
  });
  redirect(checkoutPath(locale, 'payment'));
};
