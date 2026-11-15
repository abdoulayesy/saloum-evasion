import type { AboutPage, ContactPage, WebPage } from 'schema-dts';
import { htmlLang, type Locale } from '@/i18n/routing';
import { organizationId } from './organization';

// Pages éditoriales (contrat jsonld.md) : AboutPage (À propos, Engagement), ContactPage
// (Contact), WebPage (autres), toujours reliées au site (#website) et à l'organisation (#org).

export type EditorialPageType = 'AboutPage' | 'ContactPage' | 'WebPage';

export type WebPageInput = {
  type: EditorialPageType;
  url: string;
  origin: string;
  locale: Locale;
  name: string;
  description: string;
};

export const buildWebPage = (input: WebPageInput): AboutPage | ContactPage | WebPage => {
  const common = {
    '@id': `${input.url}#webpage`,
    url: input.url,
    name: input.name,
    description: input.description,
    inLanguage: htmlLang[input.locale],
    isPartOf: { '@id': `${input.origin}/#website` },
    about: { '@id': organizationId(input.origin) },
  };
  switch (input.type) {
    case 'AboutPage':
      return { '@type': 'AboutPage', ...common };
    case 'ContactPage':
      return { '@type': 'ContactPage', ...common };
    default:
      return { '@type': 'WebPage', ...common };
  }
};
