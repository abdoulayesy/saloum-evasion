import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { primaryButtonClass } from '@/components/checkout/fieldStyles';
import { StripQueryParam } from '@/components/client/StripQueryParam';
import type { Locale } from '@/i18n/routing';
import { requestCancellation } from '@/lib/booking/cancellation';
import type { QuoteLine } from '@/lib/booking/cancellationQuote';
import { checkoutPath } from '@/lib/checkout/paths';
import { formatDate } from '@/lib/checkout/summary';
import { formatXof } from '@/lib/pricing';
import type { Booking } from '@/payload-types';

// Annulation d'une réservation (002, US4, T085 ; FR-027) : `/fr/reservation/{ref}/annulation`.
// Pour chaque prestation : payé, pourcentage du palier applicable aujourd'hui et montant
// remboursable ; choix des prestations (annulation partielle) et confirmation explicite.
// Formulaire serveur, sans JavaScript ; conçu à 360 px.

const ERRORS = new Set(['acces', 'confirmation', 'lignes']);

export const BookingCancelView = async ({
  locale,
  booking,
  quote,
  manageToken,
  errorKey,
}: {
  locale: Locale;
  booking: Booking;
  quote: QuoteLine[];
  manageToken: string | null;
  errorKey: string | null;
}) => {
  const t = await getTranslations({ locale, namespace: 'cancel' });
  const error = errorKey && ERRORS.has(errorKey) ? t(`errors.${errorKey}`) : null;
  const total = quote.reduce((sum, line) => sum + line.amount, 0);
  const tokenQuery = manageToken ? `?k=${encodeURIComponent(manageToken)}` : '';
  return (
    <>
      <StripQueryParam name="k" />
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
      <p className="mt-4">{t('intro')}</p>
      <form action={requestCancellation} className="mt-6 flex flex-col gap-5">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="bookingRef" value={booking.reference} />
        {manageToken && <input type="hidden" name="k" value={manageToken} />}
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 font-semibold">{t('linesLegend')}</legend>
          {quote.map((line) => (
            <label
              key={line.lineId}
              htmlFor={`annuler-${line.lineId}`}
              className="flex min-h-touch items-start gap-3 rounded-control border border-line bg-white p-4"
            >
              <input
                id={`annuler-${line.lineId}`}
                type="checkbox"
                name="lineIds"
                value={line.lineId}
                defaultChecked
                className="mt-1 h-5 w-5 shrink-0 accent-mangrove"
              />
              <span className="flex flex-col gap-1 font-semibold text-mangrove">
                {line.title}
                <span className="font-normal text-ink">{formatDate(line.startDate, locale)}</span>
                <span className="text-sm font-normal text-ink">
                  {t('paid', { amount: formatXof(line.paid) })}
                </span>
                <span className="text-ink" data-testid={`refund-${line.lineId}`}>
                  {t('refund', { percent: line.refundPercent, amount: formatXof(line.amount) })}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
        <p className="text-lg font-semibold" data-testid="refund-total">
          {t('total', { amount: formatXof(total) })}
        </p>
        <p className="text-sm">{t('delay')}</p>
        <label className="flex min-h-touch items-start gap-3 font-semibold">
          <input
            type="checkbox"
            name="confirm"
            required
            className="mt-1 h-5 w-5 shrink-0 accent-mangrove"
          />
          <span>{t('confirm')}</span>
        </label>
        <button type="submit" className={primaryButtonClass}>
          {t('submit')}
        </button>
      </form>
      <p className="mt-6">
        <Link
          href={`${checkoutPath(locale, 'booking', booking.reference)}${tokenQuery}`}
          className="font-semibold underline"
        >
          {t('back')}
        </Link>
      </p>
    </>
  );
};
