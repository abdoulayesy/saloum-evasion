import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BOOKING_REFERENCE_PATTERN } from '@/lib/checkout/paths';
import { tunnelLocale } from '../../../locale';

// Confirmation et gestion d'une réservation (002, T033) : `/fr/reservation/{ref}`, `/solde`,
// `/annulation` (jeton `?k=`). Tant que la vérification du jeton n'existe pas (US1, T051), la page
// répond « lien invalide » sans jamais indiquer si la référence existe (contrat des routes).

const ACTIONS = ['balance', 'cancel'] as const;

// Toujours rendue à la demande (cookie, jeton) : le layout [locale] prérend sinon ses pages.
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string; ref: string; action?: string[] }> };

const validate = async (params: Props['params']): Promise<void> => {
  const { ref, action = [] } = await params;
  const [first, ...rest] = action;
  const validAction = first === undefined || ACTIONS.some((candidate) => candidate === first);
  if (!BOOKING_REFERENCE_PATTERN.test(ref) || rest.length > 0 || !validAction) notFound();
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const locale = await tunnelLocale(params);
  const t = await getTranslations({ locale, namespace: 'booking' });
  return { title: `${t('invalidLink')} | Saloum Évasion` };
};

const BookingPage = async ({ params }: Props) => {
  const locale = await tunnelLocale(params);
  await validate(params);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'booking' });
  return <h1 className="text-mangrove">{t('invalidLink')}</h1>;
};

export default BookingPage;
