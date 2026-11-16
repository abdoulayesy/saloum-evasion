import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { tunnelLocale } from '../../locale';

// Retrouver ma réservation (002, T033) : `/fr/reservation/retrouver`, `/en/booking/find`. Le
// formulaire « référence + e-mail → lien envoyé par e-mail » arrive avec US5.

// Toujours rendue à la demande (cookie, jeton) : le layout [locale] prérend sinon ses pages.
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const locale = await tunnelLocale(params);
  const t = await getTranslations({ locale, namespace: 'booking' });
  return { title: `${t('findTitle')} | Saloum Évasion` };
};

const FindBookingPage = async ({ params }: Props) => {
  const locale = await tunnelLocale(params);
  setRequestLocale(locale);
  const [t, tc] = await Promise.all([
    getTranslations({ locale, namespace: 'booking' }),
    getTranslations({ locale, namespace: 'checkout' }),
  ]);
  return (
    <>
      <h1 className="text-mangrove">{t('findTitle')}</h1>
      <p className="mt-6">{tc('comingSoon')}</p>
    </>
  );
};

export default FindBookingPage;
