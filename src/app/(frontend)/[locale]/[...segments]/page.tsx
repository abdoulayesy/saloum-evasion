import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AccommodationView } from '@/components/views/AccommodationView';
import { AccommodationsListView, DestinationsListView } from '@/components/views/CatalogListViews';
import { DestinationView } from '@/components/views/DestinationView';
import { EditorialView, type EditorialRoute } from '@/components/views/EditorialView';
import { ExperiencesListView } from '@/components/views/ExperiencesHubView';
import { ExperienceView } from '@/components/views/ExperienceView';
import { FilmView } from '@/components/views/FilmView';
import { StaysListView } from '@/components/views/StaysListView';
import { StayView } from '@/components/views/StayView';
import { buildPath, resolvePath, type Route } from '@/i18n/pathnames';
import { isLocale, routing, type Locale } from '@/i18n/routing';
import {
  getAccommodationBySlug,
  getAlternates,
  getDestinationBySlug,
  getExperienceBySlug,
  getPage,
  getStayBySlug,
  getSiteSettingsGlobal,
  getUniverseBySlug,
  listAccommodations,
  listDestinations,
  listExperiences,
  listFaqItems,
  listStays,
  listUniverses,
  listVideos,
} from '@/lib/cms/queries';
import { populated } from '@/lib/cms/populated';
import { accommodationAlternates, destinationAlternates } from '@/lib/catalogPaths';
import { experienceAlternates, universeAlternates, universeSlugOf } from '@/lib/experiencePaths';
import { getSiteSettings } from '@/lib/cms/siteSettings';
import { isLive } from '@/lib/navigation';
import { buildMetadata, type OgImage } from '@/lib/seo/metadata';
import type { PageKey } from '@/collections/Pages';
import type { Media } from '@/payload-types';

// Résolveur des routes traduites (plan, « Structure Decision ») : associe les segments au
// type de page. Chaque type est branché ici à mesure que sa phase le livre ; un type non
// encore livré ou une URL inconnue donne la 404 localisée.
export const dynamicParams = true;

type Params = { locale: string; segments: string[] };
type PageProps = { params: Promise<Params> };

/** Pages générées au build : listes livrées et fiches publiées, en FR et en EN publiée. */
export const generateStaticParams = async (): Promise<Params[]> => {
  const params: Params[] = [];
  for (const locale of routing.locales) {
    const segmentsOf = (route: Route) =>
      buildPath(locale, route).split('/').filter(Boolean).slice(1);
    params.push({ locale, segments: segmentsOf({ type: 'staysList' }) });
    for (const stay of await listStays(locale)) {
      const slug = stay.seo?.slug;
      if (slug) params.push({ locale, segments: segmentsOf({ type: 'stay', slug }) });
    }
    params.push({ locale, segments: segmentsOf({ type: 'experiencesHub' }) });
    for (const universe of await listUniverses(locale)) {
      const slug = universe.seo?.slug;
      if (universe.kind === 'experience' && slug)
        params.push({ locale, segments: segmentsOf({ type: 'universe', universe: slug }) });
    }
    params.push({ locale, segments: segmentsOf({ type: 'destinationsList' }) });
    for (const destination of await listDestinations(locale)) {
      const slug = destination.seo?.slug;
      if (slug) params.push({ locale, segments: segmentsOf({ type: 'destination', slug }) });
    }
    params.push({ locale, segments: segmentsOf({ type: 'accommodationsList' }) });
    for (const accommodation of await listAccommodations(locale)) {
      const slug = accommodation.seo?.slug;
      if (slug) params.push({ locale, segments: segmentsOf({ type: 'accommodation', slug }) });
    }
    for (const type of EDITORIAL_TYPES) params.push({ locale, segments: segmentsOf({ type }) });
    params.push({ locale, segments: segmentsOf({ type: 'film' }) });
    for (const experience of await listExperiences(locale)) {
      const slug = experience.seo?.slug;
      const universe = universeSlugOf(experience);
      if (slug && universe)
        params.push({ locale, segments: segmentsOf({ type: 'experience', universe, slug }) });
    }
  }
  return params;
};

const resolve = async (params: Promise<Params>): Promise<{ locale: Locale; route: Route }> => {
  const { locale, segments } = await params;
  if (!isLocale(locale)) notFound();
  const route = resolvePath(locale, segments);
  if (!route || !isLive(route.type)) notFound();
  return { locale, route };
};

/** Chemins FR/EN d'un séjour, la version anglaise seulement si elle est publiée. */
const stayPaths = async (id: number): Promise<Partial<Record<Locale, string>>> => {
  const slugs = await getAlternates('stays', id);
  const paths: Partial<Record<Locale, string>> = {};
  if (slugs.fr) paths.fr = buildPath('fr', { type: 'stay', slug: slugs.fr });
  if (slugs.en) paths.en = buildPath('en', { type: 'stay', slug: slugs.en });
  return paths;
};

/** Expérience publiée dont le slug ET l'univers correspondent à l'URL, sinon 404. */
const loadExperience = async (locale: Locale, route: Extract<Route, { type: 'experience' }>) => {
  const experience = await getExperienceBySlug(locale, route.slug);
  if (!experience || universeSlugOf(experience) !== route.universe) notFound();
  return experience;
};

const loadUniverse = async (locale: Locale, route: Extract<Route, { type: 'universe' }>) => {
  const universe = await getUniverseBySlug(locale, route.universe);
  if (!universe) notFound();
  return universe;
};

const loadDestination = async (locale: Locale, slug: string) => {
  const destination = await getDestinationBySlug(locale, slug);
  if (!destination) notFound();
  return destination;
};

const loadAccommodation = async (locale: Locale, slug: string) => {
  const accommodation = await getAccommodationBySlug(locale, slug);
  if (!accommodation) notFound();
  return accommodation;
};

const listMetadata = async (
  locale: Locale,
  type: 'destinationsList' | 'accommodationsList',
  key: 'destinations_list' | 'accommodations_list',
): Promise<Metadata> => {
  const page = await getPage(locale, key);
  return buildMetadata({
    locale,
    paths: { fr: buildPath('fr', { type }), en: buildPath('en', { type }) },
    title: page?.seo?.metaTitle ?? page?.title ?? 'Saloum Évasion',
    description: page?.seo?.metaDescription ?? '',
  });
};

/** Pages institutionnelles : type de route → clé de la page dans le CMS. */
const EDITORIAL_KEYS: Record<EditorialRoute['type'], PageKey> = {
  commitment: 'commitment',
  about: 'about',
  faq: 'faq',
  contact: 'contact',
  legal: 'legal',
  privacy: 'privacy',
};
const EDITORIAL_TYPES = Object.keys(EDITORIAL_KEYS).filter(
  (type): type is EditorialRoute['type'] => type in EDITORIAL_KEYS,
);
const isEditorial = (route: Route): route is EditorialRoute => route.type in EDITORIAL_KEYS;

const fixedPaths = (route: Route) => ({ fr: buildPath('fr', route), en: buildPath('en', route) });

/** Image de partage d'un média (affiche du film), sinon l'image par défaut. */
const mediaOgImage = (media: Media | null, alt: string): OgImage | undefined =>
  media?.url
    ? { url: media.url, width: media.width ?? 1200, height: media.height ?? 630, alt }
    : undefined;

const relationId = (value: number | { id: number } | null | undefined): number | null =>
  typeof value === 'number' ? value : (value?.id ?? null);

export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
  const { locale, route } = await resolve(params);
  if (route.type === 'stay') {
    const stay = await getStayBySlug(locale, route.slug);
    if (!stay) notFound();
    return buildMetadata({
      locale,
      paths: await stayPaths(stay.id),
      title: stay.seo?.metaTitle ?? stay.title ?? '',
      description: stay.seo?.metaDescription ?? stay.summary ?? '',
      image: { url: `/og/stays/${stay.id}`, width: 1200, height: 630, alt: stay.title ?? '' },
      noindex: Boolean(stay.seo?.noindex),
      type: 'article',
    });
  }
  if (route.type === 'experience') {
    const experience = await loadExperience(locale, route);
    return buildMetadata({
      locale,
      paths: await experienceAlternates(experience),
      title: experience.seo?.metaTitle ?? experience.title ?? '',
      description: experience.seo?.metaDescription ?? experience.summary ?? '',
      image: {
        url: `/og/experiences/${experience.id}`,
        width: 1200,
        height: 630,
        alt: experience.title ?? '',
      },
      noindex: Boolean(experience.seo?.noindex),
      type: 'article',
    });
  }
  if (route.type === 'universe') {
    const universe = await loadUniverse(locale, route);
    return buildMetadata({
      locale,
      paths: await universeAlternates(universe.id),
      title: universe.seo?.metaTitle ?? universe.name ?? '',
      description: universe.seo?.metaDescription ?? universe.intro ?? '',
      image: {
        url: `/og/universes/${universe.id}`,
        width: 1200,
        height: 630,
        alt: universe.name ?? '',
      },
      noindex: Boolean(universe.seo?.noindex),
    });
  }
  if (route.type === 'destination') {
    const destination = await loadDestination(locale, route.slug);
    return buildMetadata({
      locale,
      paths: await destinationAlternates(destination.id),
      title: destination.seo?.metaTitle ?? destination.name ?? '',
      description: destination.seo?.metaDescription ?? destination.intro ?? '',
      image: {
        url: `/og/destinations/${destination.id}`,
        width: 1200,
        height: 630,
        alt: destination.name ?? '',
      },
      noindex: Boolean(destination.seo?.noindex),
    });
  }
  if (route.type === 'accommodation') {
    const accommodation = await loadAccommodation(locale, route.slug);
    return buildMetadata({
      locale,
      paths: await accommodationAlternates(accommodation.id),
      title: accommodation.seo?.metaTitle ?? accommodation.title ?? '',
      description: accommodation.seo?.metaDescription ?? accommodation.summary ?? '',
      image: {
        url: `/og/accommodations/${accommodation.id}`,
        width: 1200,
        height: 630,
        alt: accommodation.title ?? '',
      },
      noindex: Boolean(accommodation.seo?.noindex),
      type: 'article',
    });
  }
  if (route.type === 'film') {
    const [page, films] = await Promise.all([getPage(locale, 'film'), listVideos(locale, 'film')]);
    const [film] = films;
    return buildMetadata({
      locale,
      paths: fixedPaths(route),
      title: page?.seo?.metaTitle ?? page?.title ?? 'Saloum Évasion',
      description: page?.seo?.metaDescription ?? film?.description ?? '',
      image: mediaOgImage(film ? populated<Media>(film.poster) : null, film?.title ?? ''),
      type: 'article',
    });
  }
  if (isEditorial(route)) {
    const page = await getPage(locale, EDITORIAL_KEYS[route.type]);
    if (!page) notFound();
    return buildMetadata({
      locale,
      paths: fixedPaths(route),
      title: page.seo?.metaTitle ?? page.title ?? 'Saloum Évasion',
      description: page.seo?.metaDescription ?? '',
      // Mentions légales : noindex et hors sitemap (contrat routes.md).
      noindex: route.type === 'legal' || Boolean(page.seo?.noindex),
    });
  }
  if (route.type === 'destinationsList')
    return listMetadata(locale, route.type, 'destinations_list');
  if (route.type === 'accommodationsList')
    return listMetadata(locale, route.type, 'accommodations_list');
  if (route.type === 'experiencesHub') {
    const page = await getPage(locale, 'experiences_hub');
    return buildMetadata({
      locale,
      paths: {
        fr: buildPath('fr', { type: 'experiencesHub' }),
        en: buildPath('en', { type: 'experiencesHub' }),
      },
      title: page?.seo?.metaTitle ?? 'Que faire au Sine-Saloum | Saloum Évasion',
      description: page?.seo?.metaDescription ?? '',
    });
  }
  if (route.type === 'staysList') {
    const page = await getPage(locale, 'stays_list');
    return buildMetadata({
      locale,
      paths: {
        fr: buildPath('fr', { type: 'staysList' }),
        en: buildPath('en', { type: 'staysList' }),
      },
      title: page?.seo?.metaTitle ?? 'Séjours signature | Saloum Évasion',
      description: page?.seo?.metaDescription ?? '',
    });
  }
  notFound();
};

const ResolvedPage = async ({ params }: PageProps) => {
  const { locale, route } = await resolve(params);
  setRequestLocale(locale);
  const settings = await getSiteSettings(locale);

  if (route.type === 'stay') {
    const stay = await getStayBySlug(locale, route.slug);
    if (!stay) notFound();
    const [allStays, allDestinations] = await Promise.all([
      listStays(locale),
      listDestinations(locale),
    ]);
    return (
      <StayView
        stay={stay}
        locale={locale}
        settings={settings}
        allStays={allStays}
        allDestinations={allDestinations}
      />
    );
  }
  if (route.type === 'experience') {
    const experience = await loadExperience(locale, route);
    const [allExperiences, allStays] = await Promise.all([
      listExperiences(locale),
      listStays(locale),
    ]);
    return (
      <ExperienceView
        experience={experience}
        locale={locale}
        settings={settings}
        allExperiences={allExperiences}
        allStays={allStays}
      />
    );
  }
  if (route.type === 'destination') {
    const destination = await loadDestination(locale, route.slug);
    const [stays, experiences, accommodations, allDestinations] = await Promise.all([
      listStays(locale),
      listExperiences(locale),
      listAccommodations(locale),
      listDestinations(locale),
    ]);
    return (
      <DestinationView
        destination={destination}
        locale={locale}
        settings={settings}
        stays={stays}
        experiences={experiences}
        accommodations={accommodations}
        allDestinations={allDestinations}
      />
    );
  }
  if (route.type === 'accommodation') {
    const accommodation = await loadAccommodation(locale, route.slug);
    const [allAccommodations, allStays] = await Promise.all([
      listAccommodations(locale),
      listStays(locale),
    ]);
    return (
      <AccommodationView
        accommodation={accommodation}
        locale={locale}
        settings={settings}
        allAccommodations={allAccommodations}
        allStays={allStays}
      />
    );
  }
  if (route.type === 'film') {
    const [page, films, verticals, settingsGlobal] = await Promise.all([
      getPage(locale, 'film'),
      listVideos(locale, 'film'),
      listVideos(locale, 'vertical15'),
      getSiteSettingsGlobal(locale),
    ]);
    return (
      <FilmView
        locale={locale}
        page={page}
        settings={settings}
        settingsGlobal={settingsGlobal}
        film={films[0] ?? null}
        verticals={verticals}
      />
    );
  }
  if (isEditorial(route)) {
    const [page, settingsGlobal, faqItems, destinations] = await Promise.all([
      getPage(locale, EDITORIAL_KEYS[route.type]),
      getSiteSettingsGlobal(locale),
      route.type === 'faq' ? listFaqItems(locale) : Promise.resolve([]),
      route.type === 'contact' ? listDestinations(locale) : Promise.resolve([]),
    ]);
    if (!page) notFound();
    return (
      <EditorialView
        locale={locale}
        route={route}
        page={page}
        settings={settings}
        settingsGlobal={settingsGlobal}
        faqItems={faqItems}
        destinations={destinations}
      />
    );
  }
  if (route.type === 'destinationsList') {
    const [page, destinations] = await Promise.all([
      getPage(locale, 'destinations_list'),
      listDestinations(locale),
    ]);
    return (
      <DestinationsListView
        locale={locale}
        title={page?.title ?? ''}
        destinations={destinations}
        settings={settings}
      />
    );
  }
  if (route.type === 'accommodationsList') {
    const [page, accommodations] = await Promise.all([
      getPage(locale, 'accommodations_list'),
      listAccommodations(locale),
    ]);
    return (
      <AccommodationsListView
        locale={locale}
        title={page?.title ?? ''}
        accommodations={accommodations}
        settings={settings}
      />
    );
  }
  if (route.type === 'universe' || route.type === 'experiencesHub') {
    const [experiences, universes, hub, tHub] = await Promise.all([
      listExperiences(locale),
      listUniverses(locale),
      getPage(locale, 'experiences_hub'),
      getTranslations({ locale, namespace: 'hub' }),
    ]);
    if (route.type === 'universe') {
      const universe = await loadUniverse(locale, route);
      return (
        <ExperiencesListView
          locale={locale}
          title={universe.name ?? ''}
          intro={universe.intro ?? ''}
          route={route}
          experiences={experiences.filter((item) => relationId(item.universe) === universe.id)}
          universes={universes}
          settings={settings}
        />
      );
    }
    return (
      <ExperiencesListView
        locale={locale}
        title={hub?.title ?? ''}
        intro={tHub('intro')}
        route={route}
        experiences={experiences}
        universes={universes}
        settings={settings}
      />
    );
  }
  if (route.type === 'staysList') {
    const [page, stays] = await Promise.all([getPage(locale, 'stays_list'), listStays(locale)]);
    return (
      <StaysListView locale={locale} title={page?.title ?? ''} stays={stays} settings={settings} />
    );
  }
  notFound();
};

export default ResolvedPage;
