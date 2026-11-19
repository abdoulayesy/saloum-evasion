import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  CheckoutDetailsView,
  CheckoutPaymentView,
  CheckoutStatusView,
} from '@/components/views/CheckoutViews';
import { canAccessBooking } from '@/lib/booking/access';
import { findBookingForCart } from '@/lib/booking/createBooking';
import { bookingPaymentPlan } from '@/lib/booking/plan';
import { loadCartState } from '@/lib/cart/load';
import { isCartPayable } from '@/lib/cart/validate';
import { checkoutPath } from '@/lib/checkout/paths';
import { getPayloadClient } from '@/lib/cms/queries';
import { tunnelLocale } from '../../locale';

// Étapes coordonnées, paiement et statut (002, T052 à T057) : `/fr/commande/{coordonnees|paiement|
// statut}`. Une étape demandée sans ses prérequis renvoie (303) vers la première étape incomplète.

const STEPS = ['details', 'payment', 'status'] as const;

type Step = (typeof STEPS)[number];

const isStep = (value: string): value is Step => STEPS.some((step) => step === value);

// Toujours rendue à la demande (cookie, jeton) : le layout [locale] prérend sinon ses pages.
export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string; step: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const stepOf = async (params: Props['params']): Promise<Step> => {
  const { step } = await params;
  if (!isStep(step)) notFound();
  return step;
};

const single = (value: string | string[] | undefined): string | null =>
  typeof value === 'string' ? value : null;

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const [locale, step] = await Promise.all([tunnelLocale(params), stepOf(params)]);
  const t = await getTranslations({ locale, namespace: 'checkout' });
  return { title: `${t(`steps.${step}`)} | Saloum Évasion` };
};

const CheckoutStepPage = async ({ params, searchParams }: Props) => {
  const [locale, step] = await Promise.all([tunnelLocale(params), stepOf(params)]);
  setRequestLocale(locale);
  const search = await searchParams;
  const payload = await getPayloadClient();

  if (step === 'status') {
    const id = Number(single(search.p));
    const payment =
      Number.isInteger(id) && id > 0
        ? await payload
            .findByID({ collection: 'payments', id, depth: 0, disableErrors: true })
            .catch(() => null)
        : null;
    if (!payment) redirect(checkoutPath(locale, 'cart'));
    const bookingId = typeof payment.booking === 'number' ? payment.booking : payment.booking.id;
    const booking = await payload.findByID({
      collection: 'bookings',
      id: bookingId,
      depth: 0,
      showHiddenFields: true,
    });
    const token = single(search.k);
    if (!(await canAccessBooking(payload, booking, token))) redirect(checkoutPath(locale, 'cart'));
    if (payment.status === 'succeeded')
      redirect(
        `${checkoutPath(locale, 'booking', booking.reference)}${token ? `?k=${encodeURIComponent(token)}` : ''}`,
      );
    return (
      <CheckoutStatusView
        locale={locale}
        payment={payment}
        bookingReference={booking.reference}
        manageToken={token}
        cancelled={single(search.cancelled) === '1'}
      />
    );
  }

  const state = await loadCartState(payload, locale);
  if (!state.cart || !isCartPayable(state.reviewed)) redirect(checkoutPath(locale, 'cart'));

  if (step === 'details') {
    const contact = state.cart.contact ?? {};
    return (
      <CheckoutDetailsView
        locale={locale}
        total={state.reviewed.reduce((sum, line) => sum + line.currentTotal, 0)}
        defaults={{
          firstName: contact.firstName ?? undefined,
          lastName: contact.lastName ?? undefined,
          whatsapp: contact.whatsapp ?? undefined,
          email: contact.email ?? undefined,
        }}
      />
    );
  }

  const booking = await findBookingForCart(payload, state.cart);
  if (!booking || booking.status !== 'awaiting_payment') redirect(checkoutPath(locale, 'details'));
  const [plan, active] = await Promise.all([
    bookingPaymentPlan(payload, booking),
    payload.find({
      collection: 'payments',
      where: {
        and: [{ booking: { equals: booking.id } }, { status: { in: ['initiated', 'pending'] } }],
      },
      limit: 1,
      depth: 0,
    }),
  ]);
  const current = active.docs[0];
  return (
    <CheckoutPaymentView
      locale={locale}
      booking={booking}
      plan={plan}
      errorKey={single(search.erreur)}
      activePayment={current && new Date(current.expiresAt) > new Date() ? current : null}
    />
  );
};

export default CheckoutStepPage;
