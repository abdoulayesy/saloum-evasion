import { getTranslations } from 'next-intl/server';
import { StayCard } from '@/components/cards/StayCard';
import { FilterSheet } from '@/components/client/FilterSheet';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { buildPath } from '@/i18n/pathnames';
import type { Locale } from '@/i18n/routing';
import { BUDGETS, DURATIONS, MOODS } from '@/lib/filters';
import { whatsappAction } from '@/lib/pageActions';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildBreadcrumbList } from '@/lib/seo/jsonld/breadcrumb';
import { buildGraph } from '@/lib/seo/jsonld/graph';
import { buildItemList } from '@/lib/seo/jsonld/itemList';
import { buildOrganization } from '@/lib/seo/jsonld/organization';
import { absoluteUrl, siteUrl, type SiteSettings } from '@/lib/site';
import type { Stay } from '@/payload-types';

type StaysListViewProps = {
  locale: Locale;
  title: string;
  stays: readonly Stay[];
  settings: SiteSettings;
};

/** Libellés pluriels « # séjours » pour l'îlot client (ICU résolu côté serveur). */
const pluralLabels = (format: (count: number) => string) => ({
  zero: format(0),
  one: format(1).replace('1', '#'),
  other: format(2).replace('2', '#'),
});

// Liste des séjours (T090, FR-002) : toutes les fiches rendues au build (indexables, sans JS),
// filtrage côté client par le panneau qui monte du bas, nombre annoncé (aria-live), état vide
// avec contact WhatsApp. Canonical sans paramètres de filtre (contrat routes.md).
export const StaysListView = async ({ locale, title, stays, settings }: StaysListViewProps) => {
  const t = await getTranslations({ locale, namespace: 'list' });
  const tDurations = await getTranslations({ locale, namespace: 'durations' });
  const tMoods = await getTranslations({ locale, namespace: 'moods' });
  const tBudgets = await getTranslations({ locale, namespace: 'budgets' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const path = buildPath(locale, { type: 'staysList' });
  const url = absoluteUrl(path);
  const origin = siteUrl();
  const listed = stays.filter((stay) => stay.seo?.slug);

  const crumbs = buildBreadcrumbs({ locale, route: { type: 'staysList' } });
  const graph = buildGraph([
    buildOrganization(settings, origin),
    buildBreadcrumbList(crumbs, url, origin),
    buildItemList(
      url,
      listed.map((stay) =>
        absoluteUrl(buildPath(locale, { type: 'stay', slug: stay.seo?.slug ?? '' })),
      ),
    ),
  ]);
  const whatsapp = await whatsappAction(locale, settings, { path });

  return (
    <div className="pb-12">
      <JsonLd graph={graph} />
      <Breadcrumbs crumbs={crumbs} label={tCommon('breadcrumbLabel')} />
      <Container className="pt-4">
        <h1 className="text-mangrove">{title}</h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-muted">{t('intro')}</p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p id="resultats-nombre" aria-live="polite" className="font-semibold tabular-nums">
            {t('results', { count: listed.length })}
          </p>
          <FilterSheet
            openLabel={t('filters')}
            title={t('filtersTitle')}
            closeLabel={t('close')}
            resetLabel={t('reset')}
            groupLabels={{ duration: t('duration'), mood: t('mood'), budget: t('budget') }}
            durations={DURATIONS.map((value) => ({ value, label: tDurations(value) }))}
            moods={MOODS.map((value) => ({ value, label: tMoods(value) }))}
            budgets={BUDGETS.map((value) => ({ value, label: tBudgets(value) }))}
            applyLabel={pluralLabels((count) => t('apply', { count }))}
            resultsLabel={pluralLabels((count) => t('results', { count }))}
          />
        </div>

        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listed.map((stay, index) => (
            <li key={stay.id}>
              <StayCard stay={stay} locale={locale} headingLevel={2} priority={index === 0} />
            </li>
          ))}
        </ul>

        <div id="liste-vide" hidden={listed.length > 0} className="mt-8 rounded-card bg-white p-6">
          <p className="text-lg font-semibold">{t('empty')}</p>
          <p className="mt-2 text-ink-muted">{t('emptyHelp')}</p>
          {whatsapp && (
            <ButtonLink
              href={whatsapp.href}
              variant="whatsapp"
              external
              ariaLabel={whatsapp.ariaLabel}
              className="mt-4"
            >
              {whatsapp.label}
            </ButtonLink>
          )}
        </div>
      </Container>
    </div>
  );
};
