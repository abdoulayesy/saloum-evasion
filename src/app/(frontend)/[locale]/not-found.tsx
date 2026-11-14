import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { ErrorView, primaryButtonClass } from '@/components/views/ErrorView';
import { buildPath } from '@/i18n/pathnames';
import { isLocale, routing } from '@/i18n/routing';
import { liveMainNavigation } from '@/lib/navigation';

// 404 localisée : statut 404 et `noindex` posés par Next ; ni canonical ni hreflang ni
// JSON-LD (le layout n'en émet pas).
const NotFound = async () => {
  const requested = await getLocale();
  const locale = isLocale(requested) ? requested : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'errors' });
  const tRoutes = await getTranslations({ locale, namespace: 'routes' });
  const links = liveMainNavigation().map((route) => ({
    href: buildPath(locale, route),
    label: tRoutes(route.type),
  }));

  return (
    <>
      <title>{`${t('notFoundTitle')} | Saloum Évasion`}</title>
      <ErrorView
        title={t('notFoundTitle')}
        body={t('notFoundBody')}
        primary={
          <Link href={buildPath(locale, { type: 'home' })} className={primaryButtonClass}>
            {t('backHome')}
          </Link>
        }
        exploreTitle={t('explore')}
        links={links}
      />
    </>
  );
};

export default NotFound;
