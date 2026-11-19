import { getTranslations } from 'next-intl/server';
import { BookingSummary } from '@/components/checkout/BookingSummary';
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps';
import { primaryButtonClass } from '@/components/checkout/fieldStyles';
import { StripQueryParam } from '@/components/client/StripQueryParam';
import type { Locale } from '@/i18n/routing';
import type { Booking } from '@/payload-types';

// Confirmation et gestion d'une réservation (002, T058) : référence, statuts de paiement et de
// disponibilité, récapitulatif identique aux messages (FR-010), bon PDF. Le jeton de gestion est
// retiré de l'URL visible après l'affichage.

const PAID = new Set(['deposit_paid', 'paid', 'partially_cancelled', 'completed']);

export const BookingView = async ({
  locale,
  booking,
  manageToken,
}: {
  locale: Locale;
  booking: Booking;
  manageToken: string | null;
}) => {
  const t = await getTranslations({ locale, namespace: 'booking' });
  const paid = PAID.has(booking.status);
  const pendingLines = (booking.lines ?? []).some((line) => line.availabilityStatus === 'pending');
  const deadline = booking.availabilityDeadline
    ? new Intl.DateTimeFormat(locale === 'fr' ? 'fr-SN' : 'en-GB', {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: 'UTC',
      }).format(new Date(booking.availabilityDeadline))
    : null;
  const voucherHref = `/api/bookings/${booking.reference.toLowerCase()}/voucher${manageToken ? `?k=${encodeURIComponent(manageToken)}` : ''}`;
  return (
    <>
      <StripQueryParam name="k" />
      {paid && <CheckoutSteps locale={locale} current="status" />}
      <h1 className="text-mangrove">{t('title')}</h1>
      {paid && (
        <div role="status" className="mt-4 rounded-control bg-sable-deep px-4 py-3">
          <p className="font-semibold">{t('thanks')}</p>
          <p>{t('confirmationSent')}</p>
        </div>
      )}
      <dl className="mt-6 grid gap-2">
        <div className="flex flex-wrap justify-between gap-2">
          <dt>{t('reference', { reference: '' }).replace(/[:\s]+$/, '')}</dt>
          <dd className="text-xl font-semibold" data-testid="booking-reference">
            {booking.reference}
          </dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <dt>{t('statusLabel')}</dt>
          <dd className="font-semibold">{t(`status.${booking.status}`)}</dd>
        </div>
      </dl>
      {paid && pendingLines && deadline && (
        <p className="mt-4">{t('deadline', { date: deadline })}</p>
      )}
      <div className="mt-6">
        <BookingSummary locale={locale} booking={booking} showAvailability={paid} />
      </div>
      {paid && (
        <p className="mt-6">
          <a href={voucherHref} className={primaryButtonClass} target="_blank" rel="noopener">
            {t('voucher')}
          </a>
        </p>
      )}
    </>
  );
};
