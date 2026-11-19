import Link from 'next/link';
import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { AddToCartForm, type AddToCartOffer } from '@/components/checkout/AddToCartForm';
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps';
import {
  fieldClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/components/checkout/fieldStyles';
import { TransferPicker, type TransferChoice } from '@/components/checkout/TransferPicker';
import { RequestMigration } from '@/components/client/RequestMigration';
import { TrackEvent } from '@/components/client/TrackEvent';
import { buildPath } from '@/i18n/pathnames';
import type { Locale } from '@/i18n/routing';
import { addToCart, removeCartLine, updateCartLine } from '@/lib/cart/actions';
import { summaryLineOf } from '@/lib/cart/load';
import type { ReviewedLine } from '@/lib/cart/validate';
import { checkoutPath } from '@/lib/checkout/paths';
import { summaryLines } from '@/lib/checkout/summary';
import { formatEur, formatXof } from '@/lib/pricing';

// Page panier (002, T050) : lignes modifiables, problèmes FR-004 sous chaque ligne, total TTC
// FCFA et euro indicatif, remplacement d'hébergement, suggestions de la destination et
// transferts. Composant serveur ; tous les formulaires fonctionnent sans JavaScript.

export type CartSuggestion = { title: string; offer: AddToCartOffer };

export type PendingReplacement = {
  existingTitle: string;
  existingLineId: string;
  entries: Record<string, string>;
};

type Props = {
  locale: Locale;
  expired: boolean;
  reviewed: ReviewedLine[];
  notice: 'added' | 'removed' | 'updated' | null;
  errorKey: string | null;
  pending: PendingReplacement | null;
  /** Suggestions de la destination et transfert, diffusés après le panier (Suspense). */
  suggestionsSlot?: ReactNode;
};

const ERROR_KEYS = new Set([
  'saisie',
  'indisponible',
  'creneau',
  'retour',
  'too_soon',
  'invalid_nights',
  'below_min_nights',
  'over_capacity',
  'no_adult',
]);

export const CartView = async ({
  locale,
  expired,
  reviewed,
  notice,
  errorKey,
  pending,
  suggestionsSlot,
}: Props) => {
  const t = await getTranslations({ locale, namespace: 'cart' });
  const tCheckout = await getTranslations({ locale, namespace: 'checkout' });
  const total = reviewed.reduce((sum, line) => sum + line.item.quotedTotal, 0);
  const summary = summaryLines({
    locale,
    lines: reviewed.map(summaryLineOf),
    total,
    paymentPlan: 'full',
    depositAmount: 0,
    balanceAmount: 0,
    balanceDueDate: null,
    amountPaid: 0,
  });
  const payable = reviewed.length > 0 && reviewed.every((line) => line.issues.length === 0);
  const error = errorKey && ERROR_KEYS.has(errorKey) ? t(`errors.${errorKey}`) : null;

  return (
    <>
      <CheckoutSteps locale={locale} current="cart" />
      <RequestMigration locale={locale} migratedLabel={t('migrated')} />
      `n <TrackEvent event="cart_view" props={{ items: reviewed.length }} />
      {notice === 'added' && (
        <TrackEvent event="cart_item_added" props={{ items: reviewed.length }} />
      )}
      <h1 className="text-mangrove">{t('title')}</h1>
      {notice && (
        <p role="status" className="mt-4 rounded-control bg-sable-deep px-4 py-3 font-semibold">
          {t(notice)}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-control border-2 border-ocre px-4 py-3 font-semibold"
        >
          {error}
        </p>
      )}
      {pending && (
        <section
          aria-labelledby="remplacement"
          className="mt-6 rounded-control border-2 border-mangrove p-4"
        >
          <h2 id="remplacement" className="text-xl text-mangrove">
            {t('conflictLodging', { title: pending.existingTitle })}
          </h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            {/* Le remplacement réutilise l'action d'ajout avec `replaceLineId`. */}
            <form action={addToCart}>
              {Object.entries({ ...pending.entries, replaceLineId: pending.existingLineId }).map(
                ([name, value]) => (
                  <input key={name} type="hidden" name={name} value={value} />
                ),
              )}
              <button type="submit" className={primaryButtonClass}>
                {t('replace')}
              </button>
            </form>
            <Link href={checkoutPath(locale, 'cart')} className={secondaryButtonClass}>
              {t('keep')}
            </Link>
          </div>
        </section>
      )}
      {reviewed.length === 0 ? (
        <div className="mt-6 grid gap-4">
          <p>{expired ? t('expired') : t('empty')}</p>
          <Link href={buildPath(locale, { type: 'staysList' })} className={primaryButtonClass}>
            {t('browse')}
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-6 flex flex-col gap-4">
            {reviewed.map((line, index) => {
              const display = summary[index];
              const issuesId = `problemes-${line.item.lineId}`;
              return (
                <li
                  key={line.item.lineId}
                  className="rounded-control border border-line bg-white p-4"
                  aria-describedby={line.issues.length > 0 ? issuesId : undefined}
                >
                  <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold text-mangrove">{display?.title}</h2>
                    <p>{display?.when}</p>
                    <p>{display?.travellers}</p>
                    <p className="text-lg font-semibold">
                      {display?.price}{' '}
                      <span className="text-sm font-normal text-ink-muted">
                        {t('indicativeEur', { eur: formatEur(line.item.quotedTotal, locale) })}
                      </span>
                    </p>
                  </div>
                  {line.issues.length > 0 && (
                    <ul id={issuesId} className="mt-2 list-disc pl-5 font-semibold text-ocre">
                      {line.issues.map((issue) => (
                        <li key={issue}>{t(`issues.${issue}`)}</li>
                      ))}
                    </ul>
                  )}
                  {line.offer && line.currentTotal !== line.item.quotedTotal && (
                    <p className="mt-2 text-sm">
                      {t('priceChanged', {
                        before: formatXof(line.item.quotedTotal),
                        after: formatXof(line.currentTotal),
                      })}
                    </p>
                  )}
                  <div className="mt-3 flex flex-col gap-3">
                    {line.item.offerType !== 'transfer' && (
                      <details>
                        <summary className="inline-flex min-h-touch cursor-pointer items-center font-semibold underline underline-offset-4">
                          {t('edit')}
                        </summary>
                        <form
                          action={updateCartLine}
                          className="mt-2 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-4"
                        >
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="lineId" value={line.item.lineId} />
                          {(
                            [
                              ['adults', t('adults'), 1, line.item.adults],
                              ['children', t('children'), 0, line.item.children],
                              ['infants', t('infants'), 0, line.item.infants],
                            ] as const
                          ).map(([name, label, min, value]) => (
                            <div key={name} className="min-w-0">
                              <label htmlFor={`${line.item.lineId}-${name}`} className="text-sm">
                                {label}
                              </label>
                              <input
                                id={`${line.item.lineId}-${name}`}
                                name={name}
                                type="number"
                                inputMode="numeric"
                                min={min}
                                max={30}
                                defaultValue={value}
                                className={fieldClass}
                              />
                            </div>
                          ))}
                          <button type="submit" className={`${secondaryButtonClass} self-end`}>
                            {t('update')}
                          </button>
                        </form>
                      </details>
                    )}
                    <form action={removeCartLine}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="lineId" value={line.item.lineId} />
                      <button
                        type="submit"
                        className="inline-flex min-h-touch items-center font-semibold underline underline-offset-4"
                        aria-label={`${t('remove')} : ${display?.title ?? ''}`}
                      >
                        {t('remove')}
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 flex flex-col gap-2 border-t border-line pt-4">
            <p className="flex items-baseline justify-between gap-4 text-xl font-semibold">
              <span>{t('total')}</span>
              <span data-testid="cart-total">{formatXof(total)}</span>
            </p>
            <p className="text-right text-sm text-ink-muted">
              {formatEur(total, locale)} {tCheckout('indicative')}
            </p>
            {payable ? (
              <Link href={checkoutPath(locale, 'details')} className={`${primaryButtonClass} mt-2`}>
                {t('continue')}
              </Link>
            ) : (
              <p role="status" className="mt-2 font-semibold text-ocre">
                {t('fixBeforeContinue')}
              </p>
            )}
            <Link
              href={buildPath(locale, { type: 'request' })}
              className="inline-flex min-h-touch items-center underline underline-offset-4"
            >
              {t('quoteInstead')}
            </Link>
          </div>
        </>
      )}
      {suggestionsSlot}
    </>
  );
};

type SuggestionsProps = {
  locale: Locale;
  suggestions: CartSuggestion[];
  transfers: TransferChoice[];
  defaultDates: { startDate?: string; endDate?: string; adults?: number };
};

/** Compléter son séjour : expériences de la destination et transfert, formulaires serveur. */
export const CartSuggestionsSection = async ({
  locale,
  suggestions,
  transfers,
  defaultDates,
}: SuggestionsProps) => {
  if (suggestions.length === 0 && transfers.length === 0) return null;
  const t = await getTranslations({ locale, namespace: 'cart' });
  return (
    <section aria-labelledby="suggestions" className="mt-10">
      <h2 id="suggestions" className="text-xl text-mangrove">
        {t('suggestions')}
      </h2>
      <p className="mt-2 text-ink-muted">{t('suggestionsIntro')}</p>
      <div className="mt-4 flex flex-col gap-3">
        {suggestions.map((suggestion) => (
          <details
            key={`${suggestion.offer.offerType}-${suggestion.offer.id}`}
            className="rounded-control border border-line bg-white p-4"
          >
            <summary className="flex min-h-touch cursor-pointer items-center font-semibold text-mangrove">
              {suggestion.title}
            </summary>
            <div className="mt-3">
              <AddToCartForm
                locale={locale}
                offer={suggestion.offer}
                idPrefix={`suggestion-${suggestion.offer.id}`}
                defaults={defaultDates}
              />
            </div>
          </details>
        ))}
        {transfers.length > 0 && (
          <details className="rounded-control border border-line bg-white p-4">
            <summary className="flex min-h-touch cursor-pointer items-center font-semibold text-mangrove">
              {t('transferTitle')}
            </summary>
            <div className="mt-3">
              <TransferPicker
                locale={locale}
                transfers={transfers}
                defaults={{
                  outboundDate: defaultDates.startDate,
                  returnDate: defaultDates.endDate,
                  passengers: defaultDates.adults,
                }}
              />
            </div>
          </details>
        )}
      </div>
    </section>
  );
};
