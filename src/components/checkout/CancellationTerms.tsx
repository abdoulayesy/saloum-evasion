import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import type { Booking } from '@/payload-types';

// Conditions d'annulation figées de chaque ligne (002, T055, FR-014 ; constitution V), affichées
// avant le bouton « Payer », avec la case d'acceptation obligatoire.

type Tier = { daysBeforeArrivalMin: number; refundPercent: number };

type Snapshot = { name: string; summary: string; tiers: Tier[] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const snapshotOf = (value: unknown): Snapshot | null => {
  if (!isRecord(value) || typeof value.summary !== 'string') return null;
  const tiers = Array.isArray(value.tiers)
    ? value.tiers.flatMap((tier) =>
        isRecord(tier) &&
        typeof tier.daysBeforeArrivalMin === 'number' &&
        typeof tier.refundPercent === 'number'
          ? [{ daysBeforeArrivalMin: tier.daysBeforeArrivalMin, refundPercent: tier.refundPercent }]
          : [],
      )
    : [];
  return { name: typeof value.name === 'string' ? value.name : '', summary: value.summary, tiers };
};

export const CancellationTerms = async ({
  locale,
  booking,
}: {
  locale: Locale;
  booking: Booking;
}) => {
  const t = await getTranslations({ locale, namespace: 'payment' });
  const entries = (booking.lines ?? []).flatMap((line) => {
    const snapshot = snapshotOf(line.policySnapshot);
    return snapshot ? [{ lineId: line.lineId, title: line.title, snapshot }] : [];
  });
  return (
    <section
      aria-labelledby="conditions-annulation"
      className="rounded-control border border-line bg-white p-4"
    >
      <h2 id="conditions-annulation" className="text-xl text-mangrove">
        {t('termsTitle')}
      </h2>
      <ul className="mt-3 flex flex-col gap-3">
        {entries.map(({ lineId, title, snapshot }) => {
          const tiers = [...snapshot.tiers].sort(
            (a, b) => b.daysBeforeArrivalMin - a.daysBeforeArrivalMin,
          );
          return (
            <li key={lineId}>
              <p className="font-semibold">{title}</p>
              <p>{snapshot.summary}</p>
              {tiers.length > 0 && (
                <ul className="mt-1 list-disc pl-5 text-sm">
                  {tiers.map((tier, index) => {
                    const previous = tiers[index - 1];
                    return (
                      <li key={tier.daysBeforeArrivalMin}>
                        {tier.daysBeforeArrivalMin === 0 && previous
                          ? t('tierLast', {
                              days: previous.daysBeforeArrivalMin,
                              percent: tier.refundPercent,
                            })
                          : t('tier', {
                              days: tier.daysBeforeArrivalMin,
                              percent: tier.refundPercent,
                            })}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
};
