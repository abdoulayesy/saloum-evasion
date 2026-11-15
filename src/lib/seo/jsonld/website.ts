import type { WebSite } from 'schema-dts';
import { htmlLang, type Locale } from '@/i18n/routing';
import { organizationId } from './organization';

// WebSite (accueil uniquement). Pas de SearchAction : aucune recherche interne indexable.
export const buildWebSite = (origin: string, locale: Locale, name: string): WebSite => ({
  '@type': 'WebSite',
  '@id': `${origin}/#website`,
  url: `${origin}/${locale}`,
  name,
  inLanguage: htmlLang[locale],
  publisher: { '@id': organizationId(origin) },
});
