import type { Locale } from './routing';

// Segments d'URL traduits (contrat routes.md). Les slugs de documents sont propres à chaque
// langue (champ `slug` localisé du CMS) : ce module ne fait que les transporter.

export type Route =
  | { type: 'home' }
  | { type: 'staysList' }
  | { type: 'stay'; slug: string }
  | { type: 'experiencesHub' }
  | { type: 'universe'; universe: string }
  | { type: 'experience'; universe: string; slug: string }
  | { type: 'accommodationsList' }
  | { type: 'accommodation'; slug: string }
  | { type: 'destinationsList' }
  | { type: 'destination'; slug: string }
  | { type: 'film' }
  | { type: 'commitment' }
  | { type: 'about' }
  | { type: 'faq' }
  | { type: 'contact' }
  | { type: 'legal' }
  | { type: 'privacy' }
  | { type: 'request' }
  | { type: 'requestThanks' }
  // 004 : Carnets du Saloum (rubrique, guide) et pages d'auteur.
  | { type: 'guidesHub' }
  | { type: 'guide'; slug: string }
  | { type: 'author'; slug: string };

export type RouteType = Route['type'];

type SectionKey =
  'stays' | 'experiences' | 'accommodations' | 'destinations' | 'request' | 'guides' | 'team';

type StaticPageType = Extract<
  RouteType,
  'film' | 'commitment' | 'about' | 'faq' | 'contact' | 'legal' | 'privacy'
>;

const sections: Record<Locale, Record<SectionKey, string>> = {
  fr: {
    stays: 'sejours',
    experiences: 'experiences',
    accommodations: 'hebergements',
    destinations: 'destinations',
    request: 'demande',
    guides: 'carnets-du-saloum',
    team: 'equipe',
  },
  en: {
    stays: 'stays',
    experiences: 'experiences',
    accommodations: 'accommodation',
    destinations: 'destinations',
    request: 'request',
    guides: 'saloum-travel-guides',
    team: 'team',
  },
};

const staticPages: Record<Locale, Record<StaticPageType, string>> = {
  fr: {
    film: 'film-immersion',
    commitment: 'notre-engagement',
    about: 'a-propos',
    faq: 'faq',
    contact: 'contact',
    legal: 'mentions-legales',
    privacy: 'confidentialite',
  },
  en: {
    film: 'immersion-film',
    commitment: 'our-commitment',
    about: 'about',
    faq: 'faq',
    contact: 'contact',
    legal: 'legal-notice',
    privacy: 'privacy',
  },
};

const thanksSegment: Record<Locale, string> = { fr: 'merci', en: 'thank-you' };

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const isValidSlug = (value: string): boolean => SLUG_PATTERN.test(value);

const join = (locale: Locale, ...parts: string[]): string => ['', locale, ...parts].join('/');

/** Chemin absolu (sans origine) d'une route dans une langue. */
export const buildPath = (locale: Locale, route: Route): string => {
  const section = sections[locale];
  switch (route.type) {
    case 'home':
      return `/${locale}`;
    case 'staysList':
      return join(locale, section.stays);
    case 'stay':
      return join(locale, section.stays, route.slug);
    case 'experiencesHub':
      return join(locale, section.experiences);
    case 'universe':
      return join(locale, section.experiences, route.universe);
    case 'experience':
      return join(locale, section.experiences, route.universe, route.slug);
    case 'accommodationsList':
      return join(locale, section.accommodations);
    case 'accommodation':
      return join(locale, section.accommodations, route.slug);
    case 'destinationsList':
      return join(locale, section.destinations);
    case 'destination':
      return join(locale, section.destinations, route.slug);
    case 'request':
      return join(locale, section.request);
    case 'requestThanks':
      return join(locale, section.request, thanksSegment[locale]);
    case 'guidesHub':
      return join(locale, section.guides);
    case 'guide':
      return join(locale, section.guides, route.slug);
    case 'author':
      return join(locale, section.team, route.slug);
    case 'film':
    case 'commitment':
    case 'about':
    case 'faq':
    case 'contact':
    case 'legal':
    case 'privacy':
      return join(locale, staticPages[locale][route.type]);
    default: {
      const unreachable: never = route;
      return unreachable;
    }
  }
};

const staticPageTypes: readonly StaticPageType[] = [
  'film',
  'commitment',
  'about',
  'faq',
  'contact',
  'legal',
  'privacy',
];

const resolveStaticPage = (locale: Locale, segment: string): Route | null => {
  const type = staticPageTypes.find((candidate) => staticPages[locale][candidate] === segment);
  return type ? { type } : null;
};

/** Route correspondant aux segments qui suivent la locale, ou `null` si aucune. */
export const resolvePath = (locale: Locale, segments: readonly string[]): Route | null => {
  const section = sections[locale];
  const [first, second, third, ...rest] = segments;
  if (rest.length > 0) return null;
  if (first === undefined) return { type: 'home' };
  const slugsValid = [second, third].every((part) => part === undefined || isValidSlug(part));
  if (!slugsValid) return null;

  if (first === section.stays) {
    if (third !== undefined) return null;
    return second === undefined ? { type: 'staysList' } : { type: 'stay', slug: second };
  }
  if (first === section.experiences) {
    if (second === undefined) return { type: 'experiencesHub' };
    if (third === undefined) return { type: 'universe', universe: second };
    return { type: 'experience', universe: second, slug: third };
  }
  if (first === section.accommodations) {
    if (third !== undefined) return null;
    return second === undefined
      ? { type: 'accommodationsList' }
      : { type: 'accommodation', slug: second };
  }
  if (first === section.destinations) {
    if (third !== undefined) return null;
    return second === undefined
      ? { type: 'destinationsList' }
      : { type: 'destination', slug: second };
  }
  if (first === section.request) {
    if (third !== undefined) return null;
    if (second === undefined) return { type: 'request' };
    return second === thanksSegment[locale] ? { type: 'requestThanks' } : null;
  }
  if (first === section.guides) {
    if (third !== undefined) return null;
    return second === undefined ? { type: 'guidesHub' } : { type: 'guide', slug: second };
  }
  if (first === section.team) {
    if (second === undefined || third !== undefined) return null;
    return { type: 'author', slug: second };
  }
  if (second !== undefined) return null;
  return resolveStaticPage(locale, first);
};
