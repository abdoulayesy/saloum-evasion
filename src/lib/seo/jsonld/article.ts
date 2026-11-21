import type { Article } from 'schema-dts';
import { htmlLang, type Locale } from '@/i18n/routing';
import { organizationId } from './organization';
import { placeId } from './touristDestination';

// Guide des Carnets du Saloum → Article (004, FR-007, contracts/jsonld.md). L'auteur et le
// relecteur sont des Person dont l'@id est celui de leur page d'auteur (ProfilePage), pour
// qu'un auteur reste une seule entité sur tout le site. Jamais d'avis ni de note.

export const HEADLINE_MAX = 110;

export type ArticlePerson = { name: string; url: string };

export type ArticleInput = {
  url: string;
  origin: string;
  locale: Locale;
  headline: string;
  description: string;
  images: readonly string[];
  /** Dates civiles AAAA-MM-JJ : première publication et dernière mise à jour de fond. */
  publishedOn: string;
  updatedOn: string;
  wordCount: number;
  author: ArticlePerson;
  reviewer: ArticlePerson | null;
  /** URL des destinations liées publiées dans la langue (`about`). */
  destinationUrls: readonly string[];
};

/** @id de la Person d'une page d'auteur. */
export const personId = (authorUrl: string): string => `${authorUrl}#person`;

const person = ({ name, url }: ArticlePerson) => ({
  '@type': 'Person' as const,
  '@id': personId(url),
  name,
  url,
});

export const buildArticle = (input: ArticleInput): Article => ({
  '@type': 'Article',
  '@id': `${input.url}#article`,
  headline: input.headline.slice(0, HEADLINE_MAX),
  description: input.description,
  ...(input.images.length > 0 ? { image: [...input.images] } : {}),
  inLanguage: htmlLang[input.locale],
  datePublished: input.publishedOn,
  dateModified: input.updatedOn,
  wordCount: input.wordCount,
  author: person(input.author),
  ...(input.reviewer ? { contributor: person(input.reviewer) } : {}),
  publisher: { '@id': organizationId(input.origin) },
  mainEntityOfPage: { '@id': `${input.url}#webpage` },
  ...(input.destinationUrls.length > 0
    ? { about: input.destinationUrls.map((url) => ({ '@id': placeId(url) })) }
    : {}),
});
