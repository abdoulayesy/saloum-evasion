// Layout minimal du socle (T023) ; remplacé par le layout complet en T028 (phase 2A).
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { fontVariables } from '@/styles/fonts';
import '@/styles/globals.css';

const LOCALES = ['fr', 'en'] as const;
type Locale = (typeof LOCALES)[number];

const isLocale = (value: string): value is Locale => LOCALES.some((locale) => locale === value);

export const dynamicParams = false;

export const generateStaticParams = () => LOCALES.map((locale) => ({ locale }));

export const metadata: Metadata = {
  title: 'Saloum Évasion — séjours immersifs dans le Sine-Saloum',
  description:
    'Séjours tout compris à Ndangane et dans les îles du Sine-Saloum : hébergement, expériences, table locale et transfert en une seule demande.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f2a24',
  interactiveWidget: 'resizes-content',
};

type LayoutProps = { children: ReactNode; params: Promise<{ locale: string }> };

const LocaleLayout = async ({ children, params }: LayoutProps) => {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html lang={locale === 'fr' ? 'fr-SN' : 'en'} className={fontVariables}>
      <body>
        <a className="skip-link" href="#contenu">
          {locale === 'fr' ? 'Aller au contenu' : 'Skip to content'}
        </a>
        <main id="contenu">{children}</main>
      </body>
    </html>
  );
};

export default LocaleLayout;
