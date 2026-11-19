import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { BookingSummary } from '@/components/checkout/BookingSummary';
import { CancellationTerms } from '@/components/checkout/CancellationTerms';
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps';
import { primaryButtonClass, secondaryButtonClass } from '@/components/checkout/fieldStyles';
import { PaymentMethods } from '@/components/checkout/PaymentMethods';
import { ContactForm } from '@/components/client/ContactForm';
import { PaymentStatusPoller } from '@/components/client/PaymentStatusPoller';
import { TrackEvent } from '@/components/client/TrackEvent';
import { buildPath } from '@/i18n/pathnames';
import type { Locale } from '@/i18n/routing';
import type { PaymentPlan } from '@/lib/checkout/deposit';
import { checkoutPath } from '@/lib/checkout/paths';
import { formatDate } from '@/lib/checkout/summary';
import { startPayment } from '@/lib/payments/startPayment';
import { formatEur, formatXof } from '@/lib/pricing';
import { DIAL_CODES } from '@/lib/request/constants';
import type { Booking, Payment } from '@/payload-types';

// Étapes coordonnées, paiement et statut du tunnel (002, T053, T055, T057). Composants serveur,
// conçus à 360 px ; seuls le formulaire de coordonnées et l'interrogation du statut sont des îlots.

export const CheckoutDetailsView = async ({
  locale,
  total,
  defaults,
}: {
  locale: Locale;
  total: number;
  defaults: { firstName?: string; lastName?: string; whatsapp?: string; email?: string };
}) => {
  const t = await getTranslations({ locale, namespace: 'checkout' });
  const tCart = await getTranslations({ locale, namespace: 'cart' });
  return (
    <>
      <CheckoutSteps locale={locale} current="details" />
      <TrackEvent event="checkout_details_view" />
      <h1 className="text-mangrove">{t('steps.details')}</h1>
      <p className="mt-2 text-ink-muted">{t('detailsIntro')}</p>
      <p className="mt-4 flex flex-wrap items-baseline justify-between gap-2 rounded-control bg-white p-3 font-semibold">
        <span>{tCart('total')}</span>
        <span>
          {formatXof(total)}{' '}
          <span className="text-sm font-normal text-ink-muted">
            {formatEur(total, locale)} {t('indicative')}
          </span>
        </span>
      </p>
      <div className="mt-6">
        <ContactForm
          locale={locale}
          dialCodes={DIAL_CODES}
          privacyHref={buildPath(locale, { type: 'privacy' })}
          cartHref={checkoutPath(locale, 'cart')}
          defaults={defaults}
          labels={{
            firstName: t('firstName'),
            lastName: t('lastName'),
            whatsapp: t('whatsapp'),
            whatsappHint: t('whatsappHint'),
            dialCode: t('dialCode'),
            email: t('email'),
            emailHint: t('emailHint'),
            specialRequest: t('specialRequest'),
            consentProcessing: t('consentProcessing'),
            privacyLink: t('privacyLink'),
            consentReminders: t('consentReminders'),
            submit: t('toPayment'),
            errorSummary: t('errorSummary'),
            errors: {
              required: t('errors.required'),
              email: t('errors.email'),
              phone: t('errors.phone'),
              consent: t('errors.consent'),
              tooLong: t('errors.tooLong'),
              rateLimited: t('errors.rateLimited'),
              generic: t('errors.generic'),
              cart: t('errors.cart'),
            },
          }}
        />
      </div>
    </>
  );
};

const PAYMENT_ERRORS = new Set([
  'conditions',
  'moyen',
  'saisie',
  'acces',
  'acompte',
  'passerelle',
  'moyen_indisponible',
]);

export const CheckoutPaymentView = async ({
  locale,
  booking,
  plan,
  errorKey,
  activePayment,
}: {
  locale: Locale;
  booking: Booking;
  plan: PaymentPlan;
  errorKey: string | null;
  activePayment: Payment | null;
}) => {
  const t = await getTranslations({ locale, namespace: 'payment' });
  const tCheckout = await getTranslations({ locale, namespace: 'checkout' });
  const error = errorKey && PAYMENT_ERRORS.has(errorKey) ? t(`errors.${errorKey}`) : null;
  return (
    <>
      <CheckoutSteps locale={locale} current="payment" />
      <TrackEvent event="checkout_payment_view" props={{ deposit: plan.plan === 'deposit' }} />
      <h1 className="text-mangrove">{t('title')}</h1>
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-control border-2 border-ocre px-4 py-3 font-semibold"
        >
          {error}
        </p>
      )}
      {activePayment && (
        <p role="status" className="mt-4 rounded-control bg-sable-deep px-4 py-3">
          {t('activePayment')}{' '}
          <Link
            href={`${checkoutPath(locale, 'status')}?p=${activePayment.id}`}
            className="font-semibold underline"
          >
            {t('seeStatus')}
          </Link>
        </p>
      )}
      <div className="mt-6 flex flex-col gap-6">
        <BookingSummary locale={locale} booking={booking} />
        <p className="text-sm">{tCheckout('pendingAvailability')}</p>
        <CancellationTerms locale={locale} booking={booking} />
        <form action={startPayment} className="flex flex-col gap-5">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="bookingRef" value={booking.reference} />
          <PaymentMethods locale={locale} />
          <label className="flex min-h-touch items-start gap-3 font-semibold">
            <input
              name="acceptCancellation"
              type="checkbox"
              required
              className="mt-1 h-5 w-5 shrink-0 accent-mangrove"
            />
            <span>{t('termsAccept')}</span>
          </label>
          {plan.plan === 'deposit' ? (
            <p>
              {t('depositExplain', {
                deposit: formatXof(plan.depositAmount),
                balance: formatXof(plan.balanceAmount),
                date: formatDate(plan.balanceDueDate, locale),
              })}
            </p>
          ) : (
            <p data-testid="deposit-unavailable">{t(`depositUnavailable.${plan.reason}`)}</p>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            {plan.plan === 'deposit' && (
              <button type="submit" name="plan" value="deposit" className={primaryButtonClass}>
                {t('payDeposit', { amount: formatXof(plan.depositAmount) })}
              </button>
            )}
            <button
              type="submit"
              name="plan"
              value="full"
              className={plan.plan === 'deposit' ? secondaryButtonClass : primaryButtonClass}
            >
              {plan.plan === 'deposit'
                ? t('payTotal', { amount: formatXof(booking.total) })
                : t('payFull', { amount: formatXof(booking.total) })}
            </button>
          </div>
          <p className="text-sm text-ink-muted">{t('secure')}</p>
        </form>
      </div>
    </>
  );
};

export const CheckoutStatusView = async ({
  locale,
  payment,
  bookingReference,
  manageToken,
  cancelled,
}: {
  locale: Locale;
  payment: Payment;
  bookingReference: string;
  /** Jeton de gestion (solde payé depuis le lien reçu, sans le cookie du panier). */
  manageToken: string | null;
  cancelled: boolean;
}) => {
  const t = await getTranslations({ locale, namespace: 'payment' });
  const tokenParam = manageToken ? `k=${encodeURIComponent(manageToken)}` : '';
  const retryHref =
    payment.purpose === 'balance'
      ? `${checkoutPath(locale, 'balance', bookingReference)}${tokenParam ? `?${tokenParam}` : ''}`
      : checkoutPath(locale, 'payment');
  const refreshHref = `${checkoutPath(locale, 'status')}?p=${payment.id}${tokenParam ? `&${tokenParam}` : ''}`;
  const waiting = payment.status === 'initiated' || payment.status === 'pending';
  const title = waiting
    ? t('statusTitle')
    : payment.status === 'abandoned' ||
        (payment.status === 'failed' && payment.failureReason === 'cancelled_by_user')
      ? t('cancelledTitle')
      : payment.status === 'expired'
        ? t('expiredTitle')
        : t('failedTitle');
  return (
    <>
      <CheckoutSteps locale={locale} current="status" />
      <h1 className="text-mangrove">{title}</h1>
      {waiting ? (
        <div className="mt-6 flex flex-col gap-4">
          <p role="status" className="text-lg font-semibold">
            {t('pending')}
          </p>
          <p>{cancelled ? t('cancelled') : t('waitHint')}</p>
          <a href={refreshHref} className={secondaryButtonClass}>
            {t('refresh')}
          </a>
          <PaymentStatusPoller
            paymentId={payment.id}
            locale={locale}
            manageToken={manageToken}
            pendingLabel={t('pending')}
          />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          <p role="alert" className="text-lg">
            {payment.status === 'expired'
              ? t('expired')
              : payment.status === 'abandoned' || payment.failureReason === 'cancelled_by_user'
                ? t('cancelled')
                : t(`failure.${payment.failureReason ?? 'technical'}`)}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={retryHref} className={primaryButtonClass}>
              {t('retry')}
            </Link>
            <Link href={retryHref} className={secondaryButtonClass}>
              {t('changeMethod')}
            </Link>
          </div>
        </div>
      )}
    </>
  );
};
