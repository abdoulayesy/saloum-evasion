import type { ProfilePage } from 'schema-dts';
import { htmlLang, type Locale } from '@/i18n/routing';
import { personId } from './article';
import { organizationId } from './organization';

// Page d'auteur → ProfilePage dont l'entité principale est la Person (004, FR-003b,
// contracts/jsonld.md). Même @id de Person que l'auteur des articles (`personId`).

export type ProfilePageInput = {
  url: string;
  origin: string;
  locale: Locale;
  name: string;
  jobTitle: string;
  description: string;
  image: string | null;
  place: string;
  sameAs: readonly string[];
};

export const buildProfilePage = (input: ProfilePageInput): ProfilePage => ({
  '@type': 'ProfilePage',
  '@id': `${input.url}#webpage`,
  url: input.url,
  inLanguage: htmlLang[input.locale],
  mainEntity: {
    '@type': 'Person',
    '@id': personId(input.url),
    name: input.name,
    ...(input.jobTitle ? { jobTitle: input.jobTitle } : {}),
    ...(input.description ? { description: input.description } : {}),
    ...(input.image ? { image: input.image } : {}),
    ...(input.place ? { homeLocation: { '@type': 'Place', name: input.place } } : {}),
    worksFor: { '@id': organizationId(input.origin) },
    ...(input.sameAs.length > 0 ? { sameAs: [...input.sameAs] } : {}),
  },
});
