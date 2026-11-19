'use server';

import { randomUUID } from 'node:crypto';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { isLocale, type Locale } from '@/i18n/routing';
import { canAccessBooking, findBookingByReference } from '@/lib/booking/access';
import { bookingPaymentPlan } from '@/lib/booking/plan';
import { formEntries } from '@/lib/cart/schema';
import { checkoutPath } from '@/lib/checkout/paths';
import { getPayloadClient } from '@/lib/cms/queries';
import { trackServer } from '@/lib/analyticsServer';
import { siteUrl } from '@/lib/site';
import { getPaymentGateway } from '.';

// Démarrage d'un paiement (002, T054 ; contrat checkout-actions « startPayment ») : accès,
// refus d'un second paiement en cours (FR-019), montant calculé côté serveur, tentative
// `payments` avec clé d'idempotence, page hébergée de la passerelle (303).

const PAYMENT_TTL_MS = 30 * 60 * 1000;

const startPaymentSchema = z.object({
  bookingRef: z.string().regex(/^SE-[A-HJ-NP-Z2-9]{6}$/),
  plan: z.enum(['full', 'deposit']),
  method: z.enum(['wave', 'orange_money', 'card']),
  acceptCancellation: z.literal('on'),
});

const localeOf = (formData: FormData): Locale => {
  const value = formData.get('locale');
  return typeof value === 'string' && isLocale(value) ? value : 'fr';
};

// Annotation explicite : TypeScript ne restreint les types après un appel qu'à cette condition.
const back: (locale: Locale, error: string) => never = (locale, error) =>
  redirect(`${checkoutPath(locale, 'payment')}?erreur=${error}`);

export const startPayment = async (formData: FormData): Promise<void> => {
  const locale = localeOf(formData);
  const raw = formEntries(formData);
  if (!raw.acceptCancellation) back(locale, 'conditions');
  if (!raw.method) back(locale, 'moyen');
  const parsed = startPaymentSchema.safeParse(raw);
  if (!parsed.success) back(locale, 'saisie');
  const { bookingRef, plan, method } = parsed.data;

  const payload = await getPayloadClient();
  const booking = await findBookingByReference(payload, bookingRef);
  if (!booking || !(await canAccessBooking(payload, booking))) back(locale, 'acces');
  if (booking.status !== 'awaiting_payment')
    redirect(checkoutPath(locale, 'booking', booking.reference));

  // Un seul paiement actif par réservation (l'index unique partiel le garantit aussi).
  const now = new Date();
  const active = await payload.find({
    collection: 'payments',
    where: {
      and: [{ booking: { equals: booking.id } }, { status: { in: ['initiated', 'pending'] } }],
    },
    limit: 1,
    depth: 0,
  });
  const current = active.docs[0];
  if (current && new Date(current.expiresAt) > now) {
    redirect(`${checkoutPath(locale, 'status')}?p=${current.id}`);
  }
  if (current) {
    await payload.update({ collection: 'payments', id: current.id, data: { status: 'expired' } });
  }

  const computed = await bookingPaymentPlan(payload, booking, now);
  if (plan === 'deposit' && computed.plan !== 'deposit') back(locale, 'acompte');
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
  const amount = chosen ? chosen.depositAmount : booking.total;

  const gateway = getPaymentGateway();
  const payment = await payload.create({
    collection: 'payments',
    data: {
      booking: booking.id,
      purpose: chosen ? 'deposit' : 'full',
      method,
      amount,
      currency: 'XOF',
      gateway: gateway.id,
      idempotencyKey: randomUUID(),
      status: 'initiated',
      expiresAt: new Date(now.getTime() + PAYMENT_TTL_MS).toISOString(),
    },
  });

  const origin = siteUrl();
  const statusUrl = `${origin}${checkoutPath(locale, 'status')}?p=${payment.id}`;
  const result = await gateway.createCheckout({
    idempotencyKey: payment.idempotencyKey,
    amountXof: amount,
    method,
    bookingReference: booking.reference,
    description: `Saloum Évasion — ${booking.reference}${chosen ? ' (acompte)' : ''}`,
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
    back(locale, result.reason === 'method_unavailable' ? 'moyen_indisponible' : 'passerelle');
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
    { method, plan: chosen ? 'deposit' : 'full', locale },
    checkoutPath(locale, 'payment'),
  );
  redirect(result.redirectUrl);
};
