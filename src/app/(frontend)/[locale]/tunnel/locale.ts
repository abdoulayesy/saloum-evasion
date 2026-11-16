import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/routing';

/** Langue des routes internes du tunnel ; 404 si le segment n'est pas une langue du site. */
export const tunnelLocale = async (params: Promise<{ locale: string }>): Promise<Locale> => {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
};
