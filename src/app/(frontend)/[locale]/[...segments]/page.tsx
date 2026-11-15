import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { StaysListView } from '@/components/views/StaysListView';
import { StayView } from '@/components/views/StayView';
import { buildPath, resolvePath, type Route } from '@/i18n/pathnames';
import { isLocale, routing, type Locale } from '@/i18n/routing';
import {
  getAlternates,
  getPage,
  getStayBySlug,
  listDestinations,
  listStays,
} from '@/lib/cms/queries';
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
  if (route.type === 'staysList') {
    const [page, stays] = await Promise.all([getPage(locale, 'stays_list'), listStays(locale)]);
    return (
      <StaysListView locale={locale} title={page?.title ?? ''} stays={stays} settings={settings} />
    );
  }
  notFound();
};

export default ResolvedPage;
