import { defineRouting } from 'next-intl/routing';

// Constitution III et research R1 : /fr et /en toujours préfixés, français par défaut,
// aucune détection automatique (la racine redirige toujours vers /fr en 301, voir middleware).
export const routing = defineRouting({
  locales: ['fr', 'en'],
  defaultLocale: 'fr',
  localePrefix: 'always',
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];

export const isLocale = (value: string): value is Locale =>
  routing.locales.some((locale) => locale === value);

/** Valeur de l'attribut `lang` du document. */
export const htmlLang: Record<Locale, string> = { fr: 'fr-SN', en: 'en' };

/** Locale Open Graph. */
export const ogLocale: Record<Locale, string> = { fr: 'fr_SN', en: 'en_US' };
