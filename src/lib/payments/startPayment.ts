'use server';

import { randomUUID } from 'node:crypto';
import { redirect } from 'next/navigation';
import type { Payload } from 'payload';
import { z } from 'zod';
import { isLocale, type Locale } from '@/i18n/routing';
import { canAccessBooking, findBookingByReference } from '@/lib/booking/access';
import { bookingPaymentPlan } from '@/lib/booking/plan';
import { formEntries } from '@/lib/cart/schema';
import { checkoutPath } from '@/lib/checkout/paths';
import { getPayloadClient } from '@/lib/cms/queries';
import { trackServer } from '@/lib/analyticsServer';
import { siteUrl } from '@/lib/site';
import type { Booking } from '@/payload-types';
import { getPaymentGateway } from '.';

// Démarrage d'un paiement (002, T054 et T068 ; contrat checkout-actions « startPayment ») :
// accès, refus d'un second paiement en cours (FR-019), montant calculé côté serveur, tentative
// `payments` avec clé d'idempotence, page hébergée de la passerelle (303).
// - `startPayment` : paiement initial, total ou acompte si la réservation y est éligible ;
// - `startBalancePayment` : solde d'une réservation `deposit_paid`, depuis le lien de gestion.

const PAYMENT_TTL_MS = 30 * 60 * 1000;

const bookingRef = z.string().regex(/^SE-[A-HJ-NP-Z2-9]{6}$/);
const method = z.enum(['wave', 'orange_money', 'card']);

const startPaymentSchema = z.object({
  bookingRef,
  plan: z.enum(['full', 'deposit']),
  method,
  acceptCancellation: z.literal('on'),
});

const startBalanceSchema = z.object({
  bookingRef,
  method,
  k: z.string().min(1).max(100).optional(),
});

type PaymentMethod = z.infer<typeof method>;

const localeOf = (formData: FormData): Locale => {
  const value = formData.get('locale');
  return typeof value === 'string' && isLocale(value) ? value : 'fr';
};

const tokenQuery = (token: string | undefined): string =>
  token ? `&k=${encodeURIComponent(token)}` : '';

type Attempt = {
  payload: Payload;
  booking: Booking;
  locale: Locale;
  method: PaymentMethod;
  purpose: 'full' | 'deposit' | 'balance';
  amount: number;
  /** Jeton de gestion à conserver dans les URL de retour (solde payé depuis un autre appareil). */
  manageToken?: string;
  /** Retour vers le formulaire en cas d'échec de la passerelle. */
  back: (error: string) => never;
};

/** Paiement déjà en cours et valide → page de statut ; expiré → marqué `expired`. */
const settleActivePayment = async (
  payload: Payload,
  booking: Booking,
  locale: Locale,
  manageToken?: string,
): Promise<void> => {
  const active = await payload.find({
    collection: 'payments',
    where: {
      and: [{ booking: { equals: booking.id } }, { status: { in: ['initiated', 'pending'] } }],
    },
    limit: 1,
    depth: 0,
  });
  const current = active.docs[0];
  if (!current) return;
  if (new Date(current.expiresAt) > new Date()) {
    redirect(`${checkoutPath(locale, 'status')}?p=${current.id}${tokenQuery(manageToken)}`);
  }
  await payload.update({ collection: 'payments', id: current.id, data: { status: 'expired' } });
};

/** Tentative `payments`, page hébergée de la passerelle, redirection (303). */
const redirectToGateway = async ({
  payload,
  booking,
  locale,
  method,
  purpose,
  amount,
  manageToken,
  back,
}: Attempt): Promise<never> => {
  const gateway = getPaymentGateway();
  const payment = await payload.create({
    collection: 'payments',
    data: {
      booking: booking.id,
      purpose,
      method,
      amount,
      currency: 'XOF',
      gateway: gateway.id,
      idempotencyKey: randomUUID(),
      status: 'initiated',
      expiresAt: new Date(Date.now() + PAYMENT_TTL_MS).toISOString(),
    },
  });

  const origin = siteUrl();
  const statusUrl = `${origin}${checkoutPath(locale, 'status')}?p=${payment.id}${tokenQuery(manageToken)}`;
  const label = purpose === 'deposit' ? ' (acompte)' : purpose === 'balance' ? ' (solde)' : '';
  const result = await gateway.createCheckout({
    idempotencyKey: payment.idempotencyKey,
    amountXof: amount,
    method,
    bookingReference: booking.reference,
    description: `Saloum Évasion — ${booking.reference}${label}`,
    customer: {
      firstName: booking.traveller.firstName,
      lastName: booking.traveller.lastName,
      email: booking.traveller.email,
      phoneE164: booking.traveller.whatsapp,
    },
    locale,
    returnUrl: statusUrl,
    cancelUrl: `${statusUrl}&cancelled=1`,
    notifyUrl: `${origin}/api/payments/notify/${gateway.id}`,
  });
  if (!result.ok) {
    await payload.update({
      collection: 'payments',
      id: payment.id,
      data: { status: 'abandoned', failureReason: 'technical' },
    });
    return back(result.reason === 'method_unavailable' ? 'moyen_indisponible' : 'passerelle');
  }
  await payload.update({
    collection: 'payments',
    id: payment.id,
    data: {
      status: 'pending',
      gatewayReference: result.gatewayReference,
      redirectUrl: result.redirectUrl,
      expiresAt: result.expiresAt.toISOString(),
    },
  });
  await trackServer(
    'payment_started',
    { method, plan: purpose, locale },
    checkoutPath(locale, 'payment'),
  );
  redirect(result.redirectUrl);
};

export const startPayment = async (formData: FormData): Promise<void> => {
  const locale = localeOf(formData);
  // Annotation explicite : TypeScript ne restreint les types après un appel qu'à cette condition.
  const back: (error: string) => never = (error) =>
    redirect(`${checkoutPath(locale, 'payment')}?erreur=${error}`);
  const raw = formEntries(formData);
  if (!raw.acceptCancellation) back('conditions');
  if (!raw.method) back('moyen');
  const parsed = startPaymentSchema.safeParse(raw);
  if (!parsed.success) back('saisie');
  const { plan, method: chosenMethod } = parsed.data;

  const payload = await getPayloadClient();
  const booking = await findBookingByReference(payload, parsed.data.bookingRef);
  if (!booking || !(await canAccessBooking(payload, booking))) back('acces');
  if (booking.status !== 'awaiting_payment')
    redirect(checkoutPath(locale, 'booking', booking.reference));

  // Un seul paiement actif par réservation (l'index unique partiel le garantit aussi).
  await settleActivePayment(payload, booking, locale);

  const computed = await bookingPaymentPlan(payload, booking);
  if (plan === 'deposit' && computed.plan !== 'deposit') back('acompte');
  const chosen = plan === 'deposit' && computed.plan === 'deposit' ? computed : null;
  await payload.update({
    collection: 'bookings',
    id: booking.id,
    data: chosen
      ? {
          paymentPlan: 'deposit',
          depositAmount: chosen.depositAmount,
          balanceAmount: chosen.balanceAmount,
          balanceDueDate: chosen.balanceDueDate,
        }
      : { paymentPlan: 'full', depositAmount: 0, balanceAmount: 0, balanceDueDate: null },
  });
  await redirectToGateway({
    payload,
    booking,
    locale,
    method: chosenMethod,
    purpose: chosen ? 'deposit' : 'full',
    amount: chosen ? chosen.depositAmount : booking.total,
    back,
  });
};

export const startBalancePayment = async (formData: FormData): Promise<void> => {
  const locale = localeOf(formData);
  const raw = formEntries(formData);
  const parsed = startBalanceSchema.safeParse(raw);
  const reference = typeof raw.bookingRef === 'string' ? raw.bookingRef : '';
  const token = parsed.success ? parsed.data.k : undefined;
  const balancePage = bookingRef.safeParse(reference).success
    ? checkoutPath(locale, 'balance', reference)
    : checkoutPath(locale, 'find');
  const back: (error: string) => never = (error) =>
    redirect(`${balancePage}?erreur=${error}${tokenQuery(token)}`);
  if (!raw.method) back('moyen');
  if (!parsed.success) back('saisie');

  const payload = await getPayloadClient();
  const booking = await findBookingByReference(payload, parsed.data.bookingRef);
  if (!booking || !(await canAccessBooking(payload, booking, token))) back('acces');
  const bookingPage = `${checkoutPath(locale, 'booking', booking.reference)}${token ? `?k=${encodeURIComponent(token)}` : ''}`;
  if (booking.status !== 'deposit_paid' || booking.balanceAmount <= 0) redirect(bookingPage);

  await settleActivePayment(payload, booking, locale, token);
  await redirectToGateway({
    payload,
    booking,
    locale,
    method: parsed.data.method,
    purpose: 'balance',
    amount: booking.balanceAmount,
    manageToken: token,
    back,
  });
};
