import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { BookingSummary } from '@/components/checkout/BookingSummary';
import { primaryButtonClass } from '@/components/checkout/fieldStyles';
import { PaymentMethods } from '@/components/checkout/PaymentMethods';
import { StripQueryParam } from '@/components/client/StripQueryParam';
import type { Locale } from '@/i18n/routing';
import { checkoutPath } from '@/lib/checkout/paths';
import { formatDate } from '@/lib/checkout/summary';
import { startBalancePayment } from '@/lib/payments/startPayment';
import { formatXof } from '@/lib/pricing';
import type { Booking, Payment } from '@/payload-types';

// Paiement du solde (002, US2, T070) : `/fr/reservation/{ref}/solde?k=…`, réservation
// `deposit_paid`. Mêmes moyens de paiement, au même rang et sans présélection (parité), même
// récapitulatif ; formulaire serveur, utilisable sans JavaScript. Conçu à 360 px.

const ERRORS = new Set(['moyen', 'saisie', 'acces', 'passerelle', 'moyen_indisponible']);

export const BookingBalanceView = async ({
  locale,
  booking,
  manageToken,
  errorKey,
  activePayment,
}: {
  locale: Locale;
  booking: Booking;
  manageToken: string | null;
  errorKey: string | null;
  activePayment: Payment | null;
}) => {
  const t = await getTranslations({ locale, namespace: 'balance' });
  const tPayment = await getTranslations({ locale, namespace: 'payment' });
  const error = errorKey && ERRORS.has(errorKey) ? tPayment(`errors.${errorKey}`) : null;
  const amount = formatXof(booking.balanceAmount);
  const tokenParam = manageToken ? `k=${encodeURIComponent(manageToken)}` : '';
  const bookingHref = `${checkoutPath(locale, 'booking', booking.reference)}${tokenParam ? `?${tokenParam}` : ''}`;
  return (
    <>
      <h1 className="text-mangrove">{t('title')}</h1>
      <p className="mt-2 text-ink-muted">{t('reference', { reference: booking.reference })}</p>
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
          {tPayment('activePayment')}{' '}
          <Link
            href={`${checkoutPath(locale, 'status')}?p=${activePayment.id}${tokenParam ? `&${tokenParam}` : ''}`}
            className="font-semibold underline"
          >
            {tPayment('seeStatus')}
          </Link>
        </p>
      )}
      <p className="mt-6 text-lg" data-testid="balance-amount">
        {t('due', {
          amount,
          date: booking.balanceDueDate ? formatDate(booking.balanceDueDate, locale) : '',
        })}
      </p>
      <div className="mt-6 flex flex-col gap-6">
        <form action={startBalancePayment} className="flex flex-col gap-5">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="bookingRef" value={booking.reference} />
          {manageToken && <input type="hidden" name="k" value={manageToken} />}
          <PaymentMethods locale={locale} />
          <button type="submit" className={primaryButtonClass}>
            {t('pay', { amount })}
          </button>
          <p className="text-sm text-ink-muted">{tPayment('secure')}</p>
        </form>
        <BookingSummary locale={locale} booking={booking} titleId="recapitulatif-solde" />
        <p>
          <Link href={bookingHref} className="font-semibold underline">
            {t('back')}
          </Link>
        </p>
      </div>
      {/* Le jeton reste dans le formulaire ; il est retiré de l'URL visible après affichage. */}
      <StripQueryParam name="k" />
    </>
  );
};
