import { getTranslations } from 'next-intl/server';
import { BookingSummary } from '@/components/checkout/BookingSummary';
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps';
import { primaryButtonClass, secondaryButtonClass } from '@/components/checkout/fieldStyles';
import { StripQueryParam } from '@/components/client/StripQueryParam';
import type { Locale } from '@/i18n/routing';
import { chooseForUnavailable } from '@/lib/booking/alternatives';
import type { TravellerChoice } from '@/lib/booking/availability';
import { isChoosable } from '@/lib/booking/unavailableChoice';
import { checkoutPath } from '@/lib/checkout/paths';
import { formatDate } from '@/lib/checkout/summary';
import { formatXof } from '@/lib/pricing';
import type { Booking, Refund } from '@/payload-types';

// Confirmation et gestion d'une réservation (002, T058, T085) : référence, statuts de paiement et
// de disponibilité, récapitulatif identique aux messages (FR-010), bon PDF, montant remboursable
// à la date du jour et demande d'annulation, statut des remboursements (FR-028). Le jeton de
// gestion est retiré de l'URL visible après l'affichage.

const PAID = new Set(['deposit_paid', 'paid', 'partially_cancelled', 'completed']);

export const BookingView = async ({
  locale,
  booking,
  manageToken,
  refunds = [],
  refundableToday = null,
  cancellationRequested = false,
  choiceNotice = null,
}: {
  locale: Locale;
  booking: Booking;
  manageToken: string | null;
  /** Remboursements de la réservation et leur statut (US4, FR-028). */
  refunds?: Refund[];
  /** Montant remboursable à la date du jour, si une annulation peut être demandée. */
  refundableToday?: number | null;
  cancellationRequested?: boolean;
  /** Retour du choix pour une prestation indisponible (US4, T089). */
  choiceNotice?: 'saved' | 'impossible' | null;
}) => {
  const t = await getTranslations({ locale, namespace: 'booking' });
  const tRefund = await getTranslations({ locale, namespace: 'refund' });
  const paid = PAID.has(booking.status);
  const pendingLines = (booking.lines ?? []).some((line) => line.availabilityStatus === 'pending');
  const deadline = booking.availabilityDeadline
    ? new Intl.DateTimeFormat(locale === 'fr' ? 'fr-SN' : 'en-GB', {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: 'UTC',
      }).format(new Date(booking.availabilityDeadline))
    : null;
  const tokenQuery = manageToken ? `?k=${encodeURIComponent(manageToken)}` : '';
  const voucherHref = `/api/bookings/${booking.reference.toLowerCase()}/voucher${tokenQuery}`;
  const balanceHref = `${checkoutPath(locale, 'balance', booking.reference)}${tokenQuery}`;
  const cancelHref = `${checkoutPath(locale, 'cancel', booking.reference)}${tokenQuery}`;
  const dateTime = new Intl.DateTimeFormat(locale === 'fr' ? 'fr-SN' : 'en-GB', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'UTC',
  });
  /** Champs communs des formulaires de choix (prestation indisponible). */
  const choiceFields = (line: string, choice: TravellerChoice) => (
    <>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="bookingRef" value={booking.reference} />
      {manageToken && <input type="hidden" name="k" value={manageToken} />}
      <input type="hidden" name="lineId" value={line} />
      <input type="hidden" name="choice" value={choice} />
    </>
  );
  return (
    <>
      <StripQueryParam name="k" />
      {paid && <CheckoutSteps locale={locale} current="status" />}
      <h1 className="text-mangrove">{t('title')}</h1>
      {cancellationRequested && (
        <p role="status" className="mt-4 rounded-control bg-sable-deep px-4 py-3 font-semibold">
          {t('cancellationRequested')}
        </p>
      )}
      {paid && !cancellationRequested && (
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
      {booking.status === 'deposit_paid' && booking.balanceAmount > 0 && (
        <div className="mt-6 rounded-card border-2 border-mangrove p-4">
          <p className="font-semibold" data-testid="balance-due">
            {t('balanceDue', {
              amount: formatXof(booking.balanceAmount),
              date: booking.balanceDueDate ? formatDate(booking.balanceDueDate, locale) : '',
            })}
          </p>
          <p className="mt-4">
            <a href={balanceHref} className={primaryButtonClass}>
              {t('payBalance', { amount: formatXof(booking.balanceAmount) })}
            </a>
          </p>
        </div>
      )}
      {choiceNotice && (
        <p role="status" className="mt-4 rounded-control bg-sable-deep px-4 py-3 font-semibold">
          {t(choiceNotice === 'saved' ? 'choiceSaved' : 'choiceImpossible')}
        </p>
      )}
      {(booking.lines ?? []).filter(isChoosable).map((line) => (
        <section
          key={line.lineId}
          aria-labelledby={`indisponible-${line.lineId}`}
          className="mt-6 rounded-card border-2 border-ocre p-4"
        >
          <h2 id={`indisponible-${line.lineId}`} className="text-xl text-mangrove">
            {t('unavailableTitle', { title: line.title })}
          </h2>
          <p className="mt-2">
            {t('unavailableIntro', {
              date: line.choiceDeadline ? dateTime.format(new Date(line.choiceDeadline)) : '',
            })}
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            {(line.alternatives ?? []).map((alternative, index) => (
              <li key={alternative.id ?? index} className="rounded-control border border-line p-4">
                <p className="font-semibold">{alternative.title}</p>
                {alternative.description && <p className="mt-1">{alternative.description}</p>}
                <p className="mt-1 text-sm">
                  {alternative.price >= line.lineTotal
                    ? t('noSurcharge')
                    : t('differenceRefunded', {
                        amount: formatXof(line.lineTotal - alternative.price),
                      })}
                </p>
                <form action={chooseForUnavailable} className="mt-3">
                  {choiceFields(line.lineId, index === 0 ? 'alternative_1' : 'alternative_2')}
                  <button type="submit" className={secondaryButtonClass}>
                    {t('chooseAlternative')}
                  </button>
                </form>
              </li>
            ))}
          </ul>
          <form action={chooseForUnavailable} className="mt-4">
            {choiceFields(line.lineId, 'refund')}
            <button type="submit" className={secondaryButtonClass}>
              {t('chooseRefund')}
            </button>
          </form>
        </section>
      ))}
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
      {refunds.length > 0 && (
        <section aria-labelledby="remboursements" className="mt-8">
          <h2 id="remboursements" className="text-xl text-mangrove">
            {t('refundsTitle')}
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {refunds.map((refund) => (
              <li
                key={refund.id}
                className="rounded-control border border-line bg-white p-4"
                data-testid="refund-status"
              >
                <span className="font-semibold">{formatXof(refund.amount)}</span> —{' '}
                {tRefund(`status.${refund.status}`)}
                {refund.status === 'rejected' && refund.rejectionReason && (
                  <span className="block text-sm">{refund.rejectionReason}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      {refundableToday !== null && (
        <section aria-labelledby="annulation" className="mt-8">
          <h2 id="annulation" className="text-xl text-mangrove">
            {t('cancelTitle')}
          </h2>
          <p className="mt-2" data-testid="refundable-today">
            {t('refundableToday', { amount: formatXof(refundableToday) })}
          </p>
          <p className="mt-4">
            <a href={cancelHref} className={secondaryButtonClass}>
              {t('requestCancellation')}
            </a>
          </p>
        </section>
      )}
    </>
  );
};
