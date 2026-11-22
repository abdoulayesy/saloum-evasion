import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import {
  ComposerForm,
  type ComposerExperience,
  type ComposerLabels,
  type ComposerLodging,
  type ComposerTransfer,
} from '@/components/client/ComposerForm';
import { tunnelLocale } from '@/app/(frontend)/[locale]/tunnel/locale';
import { buildPath } from '@/i18n/pathnames';
import type { Locale } from '@/i18n/routing';
import { composeStay } from '@/lib/cart/actions';
import { CART_SUMMARY_COOKIE, parseCartSummary } from '@/lib/cart/cookies';
import { loadSeasons } from '@/lib/cart/offers';
import { todayInDakar } from '@/lib/cart/validate';
import { addDays } from '@/lib/checkout/deposit';
import { getPayloadClient } from '@/lib/cms/queries';
import { getSiteSettings } from '@/lib/cms/siteSettings';
import type { Accommodation, Experience } from '@/payload-types';

// Composer mon séjour (maquette « Composer mon séjour ») : `/fr/composer`, `/en/compose`.
// Page du tunnel (dynamique, jamais indexée) : catalogue publié lu à la demande, formulaire relié
// à la Server Action `composeStay`, qui recrée le panier avec des prix serveur.

// Toujours rendue à la demande (cookie du panier, catalogue à jour) : le layout [locale] prérend
// sinon ses pages.
export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const locale = await tunnelLocale(params);
  const t = await getTranslations({ locale, namespace: 'composer' });
  return { title: t('metaTitle') };
};

/** « 2 h », « 1 h 30 », « 45 min ». */
const durationLabel = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${String(rest).padStart(2, '0')}`;
};

const nameOf = (value: unknown): string | null =>
  typeof value === 'object' && value !== null && 'name' in value && typeof value.name === 'string'
    ? value.name
    : null;

/** Contrôles intrinsèques du panier renvoyés par `composeStay` (messages du panier). */
const CART_ISSUES = [
  'invalid_nights',
  'below_min_nights',
  'over_capacity',
  'no_adult',
  'too_soon',
] as const;

const HIGHLIGHTED_AMENITIES = ['piscine', 'vue-bolong', 'acces-plage', 'climatisation'] as const;

const loadCatalogue = async (locale: Locale) => {
  const payload = await getPayloadClient();
  const published = { _status: { equals: 'published' } } as const;
  const [accommodations, experiences, transfers, seasons] = await Promise.all([
    payload.find({
      collection: 'accommodations',
      locale,
      depth: 1,
      limit: 12,
      sort: '-priceFromPerNight',
      where: published,
    }),
    payload.find({
      collection: 'experiences',
      locale,
      depth: 1,
      limit: 24,
      sort: ['universe', 'id'],
      where: published,
    }),
    payload.find({
      collection: 'transfers',
      locale,
      depth: 0,
      limit: 6,
      sort: 'id',
      where: { bookable: { equals: true } },
    }),
    loadSeasons(payload),
  ]);
  return {
    accommodations: accommodations.docs,
    experiences: experiences.docs,
    transfers: transfers.docs,
    seasons,
  };
};

const ComposePage = async ({ params, searchParams }: Props) => {
  const locale = await tunnelLocale(params);
  const search = await searchParams;
  const [t, tCart, settings, catalogue, jar] = await Promise.all([
    getTranslations({ locale, namespace: 'composer' }),
    getTranslations({ locale, namespace: 'cart' }),
    getSiteSettings(locale),
    loadCatalogue(locale),
    cookies(),
  ]);
  const cart = parseCartSummary(jar.get(CART_SUMMARY_COOKIE)?.value);

  const isBookable = (doc: Accommodation | Experience): boolean =>
    doc.bookable === true && doc.partner !== null && doc.partner !== undefined;

  const lodgings: ComposerLodging[] = catalogue.accommodations.map((doc) => ({
    id: doc.id,
    name: doc.title ?? '',
    meta: [
      t(`type_${doc.type}`),
      t('capacity', { count: doc.capacity }),
      ...(doc.bedrooms ? [t('bedrooms', { count: doc.bedrooms })] : []),
      ...HIGHLIGHTED_AMENITIES.filter((amenity) => doc.amenities?.includes(amenity))
        .slice(0, 2)
        .map((amenity) => t(`amenity_${amenity}`)),
      ...(doc.minNights > 1 ? [t('minNights', { count: doc.minNights })] : []),
    ].join(' · '),
    lowSeasonPerNight: doc.pricing.lowSeasonPerNight,
    highSeasonPerNight: doc.pricing.highSeasonPerNight,
    minNights: doc.minNights,
    capacity: doc.capacity,
    bookable: isBookable(doc),
  }));

  const experiences: ComposerExperience[] = catalogue.experiences.map((doc) => ({
    id: doc.id,
    offerType: doc.offerKind === 'table' ? 'table' : 'experience',
    pricePerPerson: doc.pricePerPerson,
    childPercent: doc.childPricePercent,
    slots: (doc.slots ?? []).map((slot) => slot.startTime),
    name: doc.title ?? '',
    category: nameOf(doc.universe) ?? t(`category_${doc.offerKind}`),
    meta: [durationLabel(doc.durationMinutes), nameOf(doc.destination)]
      .filter((part): part is string => Boolean(part))
      .join(' · '),
    bookable: isBookable(doc),
  }));

  const transfers: ComposerTransfer[] = catalogue.transfers.map((doc) => ({
    id: doc.id,
    route: (doc.title ?? '').split('→')[0]?.trim() ?? '',
    tiers: (doc.priceTiers ?? []).map(({ maxPassengers, pricePerVehicle }) => ({
      maxPassengers,
      pricePerVehicle,
    })),
  }));

  const labels: ComposerLabels = {
    step1: t('step1'),
    step2: t('step2'),
    step2Hint: t('step2Hint'),
    step3: t('step3'),
    perNight: t('perNight'),
    arrival: t('arrival'),
    nights: t('nights'),
    guests: t('guests'),
    lessNights: t('lessNights'),
    moreNights: t('moreNights'),
    lessGuests: t('lessGuests'),
    moreGuests: t('moreGuests'),
    onRequest: t('onRequest'),
    transferTitle: t('transferTitle'),
    transferNone: t('transferNone'),
    transferMeta: t('transferMeta', { route: '{route}' }),
    summary: t('summary'),
    summaryLabel: t('summaryLabel'),
    lodgingLineOne: t('lodgingLine', { name: '{name}', count: 1 }),
    lodgingLineOther: t('lodgingLine', { name: '{name}', count: 2 }).replace('2', '{count}'),
    experienceLine: t('experienceLine', { name: '{name}', guests: '{guests}' }),
    transferLine: t('transferLine'),
    total: t('total'),
    perGuest: t('perGuest', { amount: '{amount}' }),
    eurNote: t('eurNote', { amount: '{amount}' }),
    payment: t('payment'),
    paymentNote: t('paymentNote'),
    pay: t('pay', { total: '{total}' }),
    payShort: t('payShort'),
    request: t('request'),
    requestNote: t('requestNote'),
    replaceNote: t('replaceNote'),
    conditions: t('conditions'),
    times: t('times'),
  };

  const errorCode = typeof search.erreur === 'string' ? search.erreur : null;
  const errorText = (() => {
    if (!errorCode) return null;
    if (errorCode === 'saisie' || errorCode === 'indisponible') return t(`error_${errorCode}`);
    // Contrôles du panier (nuits minimum, capacité, date trop proche…) : mêmes messages.
    const issue = CART_ISSUES.find((code) => code === errorCode);
    return issue ? tCart(`issues.${issue}`) : t('error_saisie');
  })();
  const today = todayInDakar();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pt-8 pb-24 sm:px-8 lg:px-16 lg:pt-12">
      <header className="flex max-w-3xl flex-col gap-3">
        <Link
          href={buildPath(locale, { type: 'home' })}
          className="inline-flex min-h-touch items-center self-start text-[0.9375rem] font-semibold text-ocre"
        >
          {t('back')}
        </Link>
        <p className="eyebrow text-ocre">{t('eyebrow')}</p>
        <h1 className="display text-[clamp(2.625rem,5vw,4.25rem)] leading-[1.02]">
          {t('headingStart')} <em className="text-ocre">{t('headingAccent')}</em>
        </h1>
        <p className="text-[1.0625rem] leading-relaxed text-ink-soft">{t('lead')}</p>
        <noscript>
          <p className="text-sm text-ink-muted">{t('noScript')}</p>
        </noscript>
      </header>

      {errorText && (
        <p role="alert" className="rounded-2xl border-2 border-ocre bg-paper p-4 font-semibold">
          {errorText}
        </p>
      )}

      <ComposerForm
        locale={locale}
        action={composeStay}
        lodgings={lodgings}
        experiences={experiences}
        transfers={transfers}
        seasons={catalogue.seasons}
        paymentMethods={settings.paymentMethods}
        minArrival={addDays(today, 1)}
        defaultArrival={addDays(today, 30)}
        cartHasItems={(cart?.count ?? 0) > 0}
        labels={labels}
      />
    </div>
  );
};

export default ComposePage;
