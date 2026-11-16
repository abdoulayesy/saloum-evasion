import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { isLocale } from '@/i18n/routing';
import { getSiteSettings } from '@/lib/cms/siteSettings';
import { buildWhatsAppLink } from '@/lib/whatsapp';

// Tunnel de commande (002, T033) : routes internes `/{langue}/tunnel/...`, atteintes uniquement
// par réécriture du middleware depuis les URL traduites (`/fr/panier`, `/en/cart`…), qui pose
// aussi `X-Robots-Tag: noindex` et `Cache-Control: private, no-store`. Pages dynamiques, jamais
// indexées, sans hreflang ni JSON-LD ; le résolveur `[...segments]` n'est pas touché (T19).

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { robots: { index: false, follow: false } };

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

const TunnelLayout = async ({ children, params }: Props) => {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const [t, settings] = await Promise.all([
    getTranslations({ locale, namespace: 'checkout' }),
    getSiteSettings(locale),
  ]);
  const whatsapp = buildWhatsAppLink({ number: settings.whatsapp, message: t('whatsappMessage') });
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
      {children}
      {whatsapp ? (
        <p className="mt-10 border-t border-ink/10 pt-6">
          <a
            href={whatsapp}
            rel="noopener"
            className="inline-flex min-h-touch items-center font-semibold text-mangrove underline underline-offset-4"
          >
            {t('whatsappHelp')}
          </a>
        </p>
      ) : null}
    </div>
  );
};

export default TunnelLayout;
