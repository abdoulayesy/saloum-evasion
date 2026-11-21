import type { CollectionPage } from 'schema-dts';
import { getTranslations } from 'next-intl/server';
import { GuideCard, guidePath } from '@/components/guides/GuideCard';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Container } from '@/components/ui/Container';
import { buildPath } from '@/i18n/pathnames';
import { htmlLang, type Locale } from '@/i18n/routing';
import { populated } from '@/lib/cms/populated';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildBreadcrumbList } from '@/lib/seo/jsonld/breadcrumb';
import { buildGraph } from '@/lib/seo/jsonld/graph';
import { buildItemList } from '@/lib/seo/jsonld/itemList';
import { buildOrganization, organizationId } from '@/lib/seo/jsonld/organization';
import { absoluteUrl, siteUrl, type SiteSettings } from '@/lib/site';
import type { Guide, GuideTheme } from '@/payload-types';

// Page de la rubrique « Carnets du Saloum » (004, T057, US4) : guides publiés dans la langue,
// regroupés par thème dans l'ordre des thèmes ; JSON-LD CollectionPage + ItemList + fil
// d'Ariane. Rendue côté serveur, aucun JavaScript.

type GuidesHubViewProps = { locale: Locale; guides: readonly Guide[]; settings: SiteSettings };

type ThemeGroup = { theme: GuideTheme | null; guides: Guide[] };

/** Groupes par thème (ordre du thème, puis nom), guides sans thème peuplé en dernier. */
export const groupByTheme = (guides: readonly Guide[]): ThemeGroup[] => {
  const groups = new Map<number, ThemeGroup>();
  const orphans: Guide[] = [];
  for (const guide of guides) {
    const theme = populated<GuideTheme>(guide.theme);
    if (!theme) {
      orphans.push(guide);
      continue;
    }
    const group = groups.get(theme.id) ?? { theme, guides: [] };
    group.guides.push(guide);
    groups.set(theme.id, group);
  }
  const sorted = [...groups.values()].sort(
    (a, b) =>
      (a.theme?.order ?? 0) - (b.theme?.order ?? 0) ||
      (a.theme?.name ?? '').localeCompare(b.theme?.name ?? ''),
  );
  return orphans.length > 0 ? [...sorted, { theme: null, guides: orphans }] : sorted;
};

export const GuidesHubView = async ({ locale, guides, settings }: GuidesHubViewProps) => {
  const t = await getTranslations({ locale, namespace: 'guides' });
  const tRoutes = await getTranslations({ locale, namespace: 'routes' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const title = tRoutes('guidesHub');
  const url = absoluteUrl(buildPath(locale, { type: 'guidesHub' }));
  const origin = siteUrl();
  const listed = guides.filter((guide) => guidePath(locale, guide));
  const groups = groupByTheme(listed);
  const ordered = groups.flatMap((group) => group.guides);
  const crumbs = buildBreadcrumbs({ locale, route: { type: 'guidesHub' } });
  const collectionPage: CollectionPage = {
    '@type': 'CollectionPage',
    '@id': `${url}#webpage`,
    url,
    name: title,
    description: t('hubMetaDescription'),
    inLanguage: htmlLang[locale],
    isPartOf: { '@id': `${origin}/#website` },
    publisher: { '@id': organizationId(origin) },
  };
  const graph = buildGraph([
    buildOrganization(settings, origin),
    buildBreadcrumbList(crumbs, url, origin),
    collectionPage,
    buildItemList(
      url,
      ordered.map((guide) => absoluteUrl(guidePath(locale, guide) ?? '')),
    ),
  ]);

  return (
    <div className="pb-12">
      <JsonLd graph={graph} />
      <Breadcrumbs crumbs={crumbs} label={tCommon('breadcrumbLabel')} />
      <Container className="pt-4">
        <h1 className="text-mangrove">{title}</h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-muted">{t('hubIntroFallback')}</p>
        {groups.map((group, groupIndex) => {
          const headingId = `theme-${group.theme?.id ?? 'autres'}`;
          return (
            <section key={headingId} aria-labelledby={headingId} className="mt-10">
              <h2 id={headingId} className="text-mangrove">
                {group.theme?.name ?? t('moreGuides')}
              </h2>
              <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.guides.map((guide, index) => (
                  <li key={guide.id}>
                    <GuideCard
                      guide={guide}
                      locale={locale}
                      headingLevel={3}
                      showStandfirst
                      priority={groupIndex === 0 && index === 0}
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </Container>
    </div>
  );
};
