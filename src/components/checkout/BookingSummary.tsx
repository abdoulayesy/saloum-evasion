import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { bookingSummarySource } from '@/lib/booking/summarySource';
import { summaryLines, summaryTotals } from '@/lib/checkout/summary';
import type { Booking } from '@/payload-types';

// Récapitulatif d'une réservation (002, FR-010) : mêmes lignes et même total que l'e-mail, le
// message WhatsApp et le bon PDF (source unique `summaryLines`). Option : statut de disponibilité.

type Props = { locale: Locale; booking: Booking; showAvailability?: boolean; titleId?: string };

export const BookingSummary = async ({
  locale,
  booking,
  showAvailability = false,
  titleId = 'recapitulatif',
}: Props) => {
  const t = await getTranslations({ locale, namespace: 'payment' });
  const tBooking = await getTranslations({ locale, namespace: 'booking' });
  const tCheckout = await getTranslations({ locale, namespace: 'checkout' });
  const tCart = await getTranslations({ locale, namespace: 'cart' });
  const source = { ...bookingSummarySource(booking), locale };
  const lines = summaryLines(source);
  const totals = summaryTotals(source);
  const availability = new Map(
    (booking.lines ?? []).map((line) => [line.lineId, line.availabilityStatus]),
  );
  return (
    <section aria-labelledby={titleId} className="rounded-control border border-line bg-white p-4">
      <h2 id={titleId} className="text-xl text-mangrove">
        {t('summaryTitle')}
      </h2>
      <ul className="mt-3 flex flex-col gap-3">
        {lines.map((line) => (
          <li key={line.lineId} className={line.cancelled ? 'line-through opacity-60' : undefined}>
            <p className="font-semibold">{line.title}</p>
            <p>{line.when}</p>
            <p>{line.travellers}</p>
            <p className="font-semibold">{line.price}</p>
            {showAvailability && (
              <p className="text-sm">
                {tBooking(`availability.${availability.get(line.lineId) ?? 'pending'}`)}
              </p>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-4 border-t border-line pt-3">
        <p className="flex items-baseline justify-between gap-4 text-lg font-semibold">
          <span>{tCart('total')}</span>
          <span>{totals.total}</span>
        </p>
        <p className="text-right text-sm text-ink-muted">
          {totals.totalEur} {tCheckout('indicative')}
        </p>
        {booking.amountPaid > 0 && (
          <p className="mt-1 flex justify-between gap-4">
            <span>{tBooking('paidAmount')}</span>
            <span>{totals.paid}</span>
          </p>
        )}
        {totals.balance && booking.amountPaid > 0 && (
          <p className="mt-1">
            {tBooking('balanceDue', {
              amount: totals.balance.amount,
              date: totals.balance.dueDate,
            })}
          </p>
        )}
      </div>
    </section>
  );
};
