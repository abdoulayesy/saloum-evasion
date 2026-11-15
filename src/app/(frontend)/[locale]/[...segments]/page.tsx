import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ExperiencesListView } from '@/components/views/ExperiencesHubView';
import { ExperienceView } from '@/components/views/ExperienceView';
import { StaysListView } from '@/components/views/StaysListView';
import { StayView } from '@/components/views/StayView';
import { buildPath, resolvePath, type Route } from '@/i18n/pathnames';
import { isLocale, routing, type Locale } from '@/i18n/routing';
import {
  getAlternates,
  getExperienceBySlug,
  getPage,
  getStayBySlug,
  getUniverseBySlug,
  listDestinations,
  listExperiences,
  listStays,
  listUniverses,
} from '@/lib/cms/queries';
import { experienceAlternates, universeAlternates, universeSlugOf } from '@/lib/experiencePaths';
import { getSiteSettings } from '@/lib/cms/siteSettings';
import { isLive } from '@/lib/navigation';
import { buildMetadata } from '@/lib/seo/metadata';

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
