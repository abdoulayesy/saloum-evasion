import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { HomeView } from '@/components/views/HomeView';
import { buildPath } from '@/i18n/pathnames';
import { isLocale, routing, type Locale } from '@/i18n/routing';
import { getPage, listDestinations, listStays, listUniverses, listVideos } from '@/lib/cms/queries';
import { mp4Url } from '@/lib/mux';
import { getSiteSettings } from '@/lib/cms/siteSettings';
import { buildMetadata } from '@/lib/seo/metadata';

// Accueil (T096) : contenu de `pages.home`, métadonnées, JSON-LD Organization + WebSite.

type PageProps = { params: Promise<{ locale: string }> };

const resolveLocale = (value: string): Locale => (isLocale(value) ? value : routing.defaultLocale);

export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
  const locale = resolveLocale((await params).locale);
  const [page, t] = await Promise.all([
    getPage(locale, 'home'),
    getTranslations({ locale, namespace: 'home' }),
  ]);
  return buildMetadata({
    locale,
    paths: { fr: buildPath('fr', { type: 'home' }), en: buildPath('en', { type: 'home' }) },
    title: page?.seo?.metaTitle ?? t('title'),
    description: page?.seo?.metaDescription ?? t('description'),
  });
};

const HomePage = async ({ params }: PageProps) => {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  const [page, settings, stays, universes, destinations, loops, films, verticals] =
    await Promise.all([
      getPage(locale, 'home'),
      getSiteSettings(locale),
      listStays(locale),
      listUniverses(locale),
      listDestinations(locale),
      listVideos(locale, 'loop'),
      listVideos(locale, 'film'),
      listVideos(locale, 'vertical15'),
    ]);
  const [loop] = loops;
  const [film] = films;
  // Du plus court au plus long (maquette : le week-end en premier).
  const featured = stays
    .filter((stay) => stay.featured)
    .sort((a, b) => a.durationNights - b.durationNights)
    .slice(0, 3);
  return (
    <HomeView
      locale={locale}
      page={page}
      settings={settings}
      featured={featured.length > 0 ? featured : stays.slice(0, 3)}
      universes={universes}
      destinations={destinations}
      film={film ?? null}
      verticals={verticals}
      ambientLoopSrc={loop ? (loop.staticMp4Url ?? mp4Url(loop.muxPlaybackId, 'low')) : null}
    />
  );
};

export default HomePage;
