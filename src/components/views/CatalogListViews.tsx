import { getTranslations } from 'next-intl/server';
import { AccommodationCard } from '@/components/cards/AccommodationCard';
import { DestinationCard } from '@/components/cards/DestinationCard';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Container } from '@/components/ui/Container';
import { buildPath, type Route } from '@/i18n/pathnames';
import type { Locale } from '@/i18n/routing';
import { accommodationPath, destinationPath } from '@/lib/catalogPaths';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildBreadcrumbList } from '@/lib/seo/jsonld/breadcrumb';
import { buildGraph } from '@/lib/seo/jsonld/graph';
import { buildItemList } from '@/lib/seo/jsonld/itemList';
import { buildOrganization } from '@/lib/seo/jsonld/organization';
import { absoluteUrl, siteUrl, type SiteSettings } from '@/lib/site';
import type { Accommodation, Destination } from '@/payload-types';

// Listes des destinations et des hébergements (T115, T119) : rendues côté serveur, ItemList
// des fiches, fil d'Ariane. Les hébergements sont regroupés par type, avec des puces qui
// mènent à chaque groupe (ancres : fonctionne sans JavaScript).

type ListRoute = Extract<Route, { type: 'destinationsList' | 'accommodationsList' }>;

const graphFor = (
  locale: Locale,
  route: ListRoute,
  settings: SiteSettings,
  itemPaths: string[],
) => {
  const url = absoluteUrl(buildPath(locale, route));
  const origin = siteUrl();
  const crumbs = buildBreadcrumbs({ locale, route });
  return {
    crumbs,
    graph: buildGraph([
      buildOrganization(settings, origin),
      buildBreadcrumbList(crumbs, url, origin),
      buildItemList(
        url,
        itemPaths.map((path) => absoluteUrl(path)),
      ),
    ]),
  };
};

type DestinationsListProps = {
  locale: Locale;
  title: string;
  destinations: readonly Destination[];
  settings: SiteSettings;
};

export const DestinationsListView = async ({
  locale,
  title,
  destinations,
  settings,
}: DestinationsListProps) => {
  const t = await getTranslations({ locale, namespace: 'destination' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const listed = destinations.filter((destination) => destinationPath(locale, destination));
  const { crumbs, graph } = graphFor(
    locale,
    { type: 'destinationsList' },
    settings,
    listed.map((destination) => destinationPath(locale, destination) ?? ''),
  );
  return (
    <div className="pb-12">
      <JsonLd graph={graph} />
      <Breadcrumbs crumbs={crumbs} label={tCommon('breadcrumbLabel')} />
      <Container className="pt-4">
        <h1 className="text-mangrove">{title}</h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-muted">{t('listIntro')}</p>
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listed.map((destination, index) => (
            <li key={destination.id}>
              <DestinationCard
                destination={destination}
                locale={locale}
                headingLevel={2}
                priority={index === 0}
              />
            </li>
          ))}
        </ul>
      </Container>
    </div>
  );
};

type AccommodationsListProps = {
  locale: Locale;
  title: string;
  accommodations: readonly Accommodation[];
  settings: SiteSettings;
};

const TYPES = ['villa', 'ecolodge', 'campement'] as const;

export const AccommodationsListView = async ({
  locale,
  title,
  accommodations,
  settings,
}: AccommodationsListProps) => {
  const t = await getTranslations({ locale, namespace: 'accommodation' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const listed = accommodations.filter((accommodation) => accommodationPath(locale, accommodation));
  const groups = TYPES.map((type) => ({
    type,
    items: listed.filter((accommodation) => accommodation.type === type),
  })).filter((group) => group.items.length > 0);
  const { crumbs, graph } = graphFor(
    locale,
    { type: 'accommodationsList' },
    settings,
    listed.map((accommodation) => accommodationPath(locale, accommodation) ?? ''),
  );
  let first = true;
  return (
    <div className="pb-12">
      <JsonLd graph={graph} />
      <Breadcrumbs crumbs={crumbs} label={tCommon('breadcrumbLabel')} />
      <Container className="pt-4">
        <h1 className="text-mangrove">{title}</h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-muted">{t('listIntro')}</p>
        {groups.length > 1 && (
          <nav aria-label={t('typeNav')} className="mt-6">
            <ul className="flex flex-wrap gap-2">
              {groups.map((group) => (
                <li key={group.type}>
                  <a
                    href={`#type-${group.type}`}
                    className="inline-flex min-h-touch items-center rounded-full border-2 border-mangrove px-4 font-semibold text-mangrove"
                  >
                    {t(`types.${group.type}`)} ({group.items.length})
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
        {groups.map((group) => (
          <section
            key={group.type}
            id={`type-${group.type}`}
            aria-labelledby={`type-${group.type}-titre`}
            tabIndex={-1}
            className="mt-10"
          >
            <h2 id={`type-${group.type}-titre`} className="text-mangrove">
              {t(`types.${group.type}`)}
            </h2>
            <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((accommodation) => {
                const priority = first;
                first = false;
                return (
                  <li key={accommodation.id}>
                    <AccommodationCard
                      accommodation={accommodation}
                      locale={locale}
                      priority={priority}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </Container>
    </div>
  );
};
