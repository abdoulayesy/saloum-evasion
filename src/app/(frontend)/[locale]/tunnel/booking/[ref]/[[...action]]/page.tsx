import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BookingView } from '@/components/views/BookingView';
import { canAccessBooking, findBookingByReference } from '@/lib/booking/access';
import { BOOKING_REFERENCE_PATTERN } from '@/lib/checkout/paths';
import { getPayloadClient } from '@/lib/cms/queries';
import { tunnelLocale } from '../../../locale';

// Confirmation et gestion d'une réservation (002, T058) : `/fr/reservation/{ref}` (jeton `?k=` ou
// cookie du panier). Lien invalide ou référence inconnue : même page « lien invalide » (200),
// sans indication sur l'existence de la référence. Solde et annulation : US2 et US4.

const ACTIONS = ['balance', 'cancel'] as const;

// Toujours rendue à la demande (cookie, jeton) : le layout [locale] prérend sinon ses pages.
export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string; ref: string; action?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const parse = async (params: Props['params']) => {
  const { ref, action = [] } = await params;
  const [first, ...rest] = action;
  const validAction = first === undefined || ACTIONS.some((candidate) => candidate === first);
  if (!BOOKING_REFERENCE_PATTERN.test(ref) || rest.length > 0 || !validAction) notFound();
  return { reference: ref, action: first };
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const locale = await tunnelLocale(params);
  const t = await getTranslations({ locale, namespace: 'booking' });
  return { title: `${t('title')} | Saloum Évasion` };
};

const BookingPage = async ({ params, searchParams }: Props) => {
  const locale = await tunnelLocale(params);
  const { reference, action } = await parse(params);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'booking' });
  const tCheckout = await getTranslations({ locale, namespace: 'checkout' });
  const search = await searchParams;
  const token = typeof search.k === 'string' ? search.k : null;
  const payload = await getPayloadClient();
  const booking = await findBookingByReference(payload, reference);
  if (!booking || !(await canAccessBooking(payload, booking, token))) {
    return <h1 className="text-mangrove">{t('invalidLink')}</h1>;
  }
  if (action) {
    return (
      <>
        <h1 className="text-mangrove">{t('title')}</h1>
        <p className="mt-6">{tCheckout('comingSoon')}</p>
      </>
    );
  }
  return <BookingView locale={locale} booking={booking} manageToken={token} />;
};

export default BookingPage;
