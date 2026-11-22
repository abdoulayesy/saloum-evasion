import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BookingFindView } from '@/components/views/BookingFindView';
import { tunnelLocale } from '@/app/(frontend)/[locale]/tunnel/locale';

// Retrouver ma réservation (002, US4, T087) : `/fr/reservation/retrouver`, `/en/booking/find`.
// Référence + e-mail → lien de gestion envoyé par e-mail (réponse identique dans tous les cas).

// Toujours rendue à la demande (cookie, jeton) : le layout [locale] prérend sinon ses pages.
export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const locale = await tunnelLocale(params);
  const t = await getTranslations({ locale, namespace: 'booking' });
  return { title: `${t('findTitle')} | Saloum Évasion` };
};

const FindBookingPage = async ({ params, searchParams }: Props) => {
  const locale = await tunnelLocale(params);
  setRequestLocale(locale);
  const search = await searchParams;
  return (
    <BookingFindView locale={locale} sent={search.envoye === '1'} limited={search.limite === '1'} />
  );
};

export default FindBookingPage;
