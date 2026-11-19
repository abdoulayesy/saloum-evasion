import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Payload } from 'payload';
import type { CartSuggestion, PendingReplacement } from '@/components/views/CartView';
import { CartSuggestionsSection, CartView } from '@/components/views/CartView';
import type { Locale } from '@/i18n/routing';
import { loadCartState } from '@/lib/cart/load';
import { addDays } from '@/lib/checkout/deposit';
import { getPayloadClient } from '@/lib/cms/queries';
import type { ReviewedLine } from '@/lib/cart/validate';
import { tunnelLocale } from '../locale';

// Panier (002, T050) : `/fr/panier`, `/en/cart`. Page dynamique : lit le cookie `se_cart`.

// Toujours rendue à la demande (cookie, jeton) : le layout [locale] prérend sinon ses pages.
export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const locale = await tunnelLocale(params);
  const t = await getTranslations({ locale, namespace: 'cart' });
  return { title: `${t('title')} | Saloum Évasion` };
};

const single = (value: string | string[] | undefined): string | null =>
  typeof value === 'string' ? value : null;

const decodePending = (value: string | null): Record<string, string> | null => {
  if (!value || value.length > 4000) return null;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    const entries: Record<string, string> = {};
    for (const [key, entry] of Object.entries(parsed)) {
      if (typeof entry === 'string' && /^[a-zA-Z]{1,32}$/.test(key)) entries[key] = entry;
    }
    return entries;
  } catch {
    return null;
  }
};

const LODGING = new Set(['accommodation', 'stay']);

const destinationOf = (line: ReviewedLine | undefined): number | null => {
  const offer = line?.offer;
  if (!offer) return null;
  const pick = (value: unknown): number | null =>
    typeof value === 'number'
      ? value
      : typeof value === 'object' && value !== null && 'id' in value && typeof value.id === 'number'
        ? value.id
        : null;
  if (offer.offerType === 'accommodation') return pick(offer.doc.destination);
  if (offer.offerType === 'stay') return pick(offer.doc.destinations?.[0]);
  return null;
};

const loadSuggestions = async (
  payload: Payload,
  locale: Locale,
  reviewed: ReviewedLine[],
): Promise<{ suggestions: CartSuggestion[]; transfers: { id: number; title: string }[] }> => {
  const lodging = reviewed.find((line) => LODGING.has(line.item.offerType));
  const destination = destinationOf(lodging);
  const inCart = new Set(
    reviewed.map((line) => `${line.item.offerType}-${String(line.offer?.doc.id)}`),
  );
  const [experiences, transfers] = await Promise.all([
    destination
      ? payload.find({
          collection: 'experiences',
          locale,
          depth: 0,
          limit: 6,
          where: {
            and: [
              { bookable: { equals: true } },
              { _status: { equals: 'published' } },
              { destination: { equals: destination } },
            ],
          },
        })
      : Promise.resolve({ docs: [] }),
    payload.find({
      collection: 'transfers',
      locale,
      depth: 0,
      limit: 10,
      where: { bookable: { equals: true } },
    }),
  ]);
  const suggestions: CartSuggestion[] = experiences.docs
    .map((doc): CartSuggestion => {
      const offerType = doc.offerKind === 'table' ? 'table' : 'experience';
      return {
        title: doc.title ?? '',
        offer: {
          offerType,
          id: doc.id,
          maxGuests: doc.maxParticipants,
          slots: (doc.slots ?? []).map((slot) => ({
            label: slot.label ?? slot.startTime,
            startTime: slot.startTime,
          })),
        },
      };
    })
    .filter((suggestion) => !inCart.has(`${suggestion.offer.offerType}-${suggestion.offer.id}`));
  const hasTransfer = reviewed.some((line) => line.item.offerType === 'transfer');
  return {
    suggestions,
    transfers: hasTransfer
      ? []
      : transfers.docs.map((doc) => ({ id: doc.id, title: doc.title ?? '' })),
  };
};

/** Suggestions de la destination et transfert (requêtes en parallèle), rendues avec le panier : rien ne s’affiche après lui, l’élément LCP reste stable. */
const CartSuggestions = async ({
  locale,
  reviewed,
  defaultDates,
}: {
  locale: Locale;
  reviewed: ReviewedLine[];
  defaultDates: { startDate?: string; endDate?: string; adults?: number };
}) => {
  const payload = await getPayloadClient();
  const { suggestions, transfers } = await loadSuggestions(payload, locale, reviewed);
  return (
    <CartSuggestionsSection
      locale={locale}
      suggestions={suggestions}
      transfers={transfers}
      defaultDates={defaultDates}
    />
  );
};

const CartPage = async ({ params, searchParams }: Props) => {
  const locale = await tunnelLocale(params);
  setRequestLocale(locale);
  const search = await searchParams;
  const payload = await getPayloadClient();
  const state = await loadCartState(payload, locale);

  const notice = single(search.ajoute)
    ? 'added'
    : single(search.retire)
      ? 'removed'
      : single(search.modifie)
        ? 'updated'
        : null;

  const lodging = state.reviewed.find((line) => LODGING.has(line.item.offerType));
  const pendingEntries =
    single(search.conflit) === 'hebergement' ? decodePending(single(search.attente)) : null;
  const pending: PendingReplacement | null =
    pendingEntries && lodging
      ? {
          existingTitle: lodging.title,
          existingLineId: lodging.item.lineId,
          entries: pendingEntries,
        }
      : null;

  const lodgingEnd =
    lodging?.offer?.offerType === 'stay'
      ? addDays(lodging.item.startDate, lodging.offer.doc.durationNights)
      : (lodging?.item.endDate ?? undefined);

  return (
    <CartView
      locale={locale}
      expired={state.expired}
      reviewed={state.reviewed}
      notice={notice}
      errorKey={single(search.erreur)}
      pending={pending}
      suggestionsSlot={
        state.reviewed.length > 0 ? (
          <CartSuggestions
            locale={locale}
            reviewed={state.reviewed}
            defaultDates={{
              startDate: lodging?.item.startDate,
              endDate: lodgingEnd,
              adults: lodging?.item.adults,
            }}
          />
        ) : null
      }
    />
  );
};

export default CartPage;
