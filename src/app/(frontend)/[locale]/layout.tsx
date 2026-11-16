import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Analytics } from '@/components/client/Analytics';
import { WebVitals } from '@/components/client/WebVitals';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { htmlLang, isLocale, routing } from '@/i18n/routing';
import { siteUrl } from '@/lib/site';
import { preloadFonts } from '@/styles/fonts';
import '@/styles/globals.css';

// Layout public : aucune métadonnée de page ici (canonical, hreflang et JSON-LD sont posés
// par chaque page, pour que la 404 n'en hérite pas).

// Pas de `dynamicParams = false` ici : ce réglage s'appliquerait aussi aux fiches, et un contenu
// publié après le build n'aurait pas de page. Une langue inconnue est rejetée ci-dessous.

export const generateStaticParams = () => routing.locales.map((locale) => ({ locale }));

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  applicationName: 'Saloum Évasion',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f2a24',
  // Le clavier virtuel réduit la fenêtre : la barre collante reste au-dessus, sans JS.
  interactiveWidget: 'resizes-content',
};

type LayoutProps = { children: ReactNode; params: Promise<{ locale: string }> };

const LocaleLayout = async ({ children, params }: LayoutProps) => {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'common' });
  preloadFonts();

  return (
    <html lang={htmlLang[locale]}>
      <body className="flex min-h-dvh flex-col">
        <a className="skip-link" href="#contenu">
          {t('skipToContent')}
        </a>
        <Header locale={locale} />
        <main id="contenu" tabIndex={-1} className="flex-1">
          {children}
        </main>
        <Footer locale={locale} />
        {/* Mesure sans cookie, après inactivité (T161, T162) ; désactivée sans domaine configuré. */}
        <Analytics
          domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || null}
          scriptSrc="https://plausible.io/js/script.js"
        />
        <WebVitals />
      </body>
    </html>
  );
};

export default LocaleLayout;
