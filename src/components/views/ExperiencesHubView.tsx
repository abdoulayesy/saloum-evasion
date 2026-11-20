import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ExperienceCard } from '@/components/cards/ExperienceCard';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CmsImage } from '@/components/ui/CmsImage';
import { Container } from '@/components/ui/Container';
import { buildPath, type Route } from '@/i18n/pathnames';
import type { Locale } from '@/i18n/routing';
import { populated } from '@/lib/cms/populated';
import { experiencePath } from '@/lib/experiencePaths';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildBreadcrumbList } from '@/lib/seo/jsonld/breadcrumb';
import { buildGraph } from '@/lib/seo/jsonld/graph';
import { buildItemList } from '@/lib/seo/jsonld/itemList';
import { buildOrganization } from '@/lib/seo/jsonld/organization';
import { absoluteUrl, siteUrl, type SiteSettings } from '@/lib/site';
import type { Experience, Media, Universe } from '@/payload-types';

type ListViewProps = {
  locale: Locale;
  title: string;
  intro: string;
  route: Extract<Route, { type: 'experiencesHub' | 'universe' }>;
  experiences: readonly Experience[];
  universes: readonly Universe[];
  settings: SiteSettings;
};

const relationId = (value: number | { id: number } | null | undefined): number | null =>
  typeof value === 'number' ? value : (value?.id ?? null);

// Hub « Que faire au Sine-Saloum » et pages d'univers (T103) : rendus côté serveur, ItemList
// des fiches, fil d'Ariane ; sur le hub, accès aux trois univers d'expériences.
export const ExperiencesListView = async ({
  locale,
  title,
  intro,
  route,
  experiences,
  universes,
  settings,
}: ListViewProps) => {
  const t = await getTranslations({ locale, namespace: 'hub' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const path = buildPath(locale, route);
  const url = absoluteUrl(path);
  const origin = siteUrl();
  const listed = experiences.filter((experience) => experiencePath(locale, experience));
  const experienceUniverses = universes.filter(
    (universe) => universe.kind === 'experience' && universe.seo?.slug,
  );
  const showsUniverses = route.type === 'experiencesHub' && experienceUniverses.length > 0;

  const crumbs = buildBreadcrumbs({ locale, route, currentName: title });
  const graph = buildGraph([
    buildOrganization(settings, origin),
    buildBreadcrumbList(crumbs, url, origin),
    buildItemList(
      url,
      listed.map((experience) => absoluteUrl(experiencePath(locale, experience) ?? '')),
    ),
  ]);

  return (
    <div className="pb-12">
      <JsonLd graph={graph} />
      <Breadcrumbs crumbs={crumbs} label={tCommon('breadcrumbLabel')} />
      <Container className="pt-4">
        <h1 className="text-mangrove">{title}</h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-muted">{intro}</p>

        {showsUniverses && (
          <section aria-labelledby="hub-univers" className="mt-8">
            <h2 id="hub-univers" className="text-mangrove">
              {t('universes')}
            </h2>
            <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {experienceUniverses.map((universe, index) => {
                const count = experiences.filter(
                  (item) => relationId(item.universe) === universe.id,
                ).length;
                return (
                  <li key={universe.id} className="relative overflow-hidden rounded-card bg-white">
                    <CmsImage
                      media={populated<Media>(universe.image)}
                      locale={locale}
                      sizes="(min-width: 640px) 33vw, 100vw"
                      // Première image de la page, élément LCP du hub (mesure Lighthouse 002).
                      priority={index === 0}
                      className="aspect-[16/9] w-full object-cover"
                    />
                    <div className="p-4">
                      <h3 className="text-2xl">
                        <Link
                          href={buildPath(locale, {
                            type: 'universe',
                            universe: universe.seo?.slug ?? '',
                          })}
                          className="flex min-h-touch items-center after:absolute after:inset-0"
                        >
                          {universe.name}
                        </Link>
                      </h3>
                      <p className="text-sm text-ink-muted">{t('count', { count })}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section aria-labelledby="liste-experiences" className="mt-10">
          <h2 id="liste-experiences" className="text-mangrove">
            {route.type === 'experiencesHub' ? t('all') : t('count', { count: listed.length })}
          </h2>
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listed.map((experience, index) => (
              <li key={experience.id}>
                <ExperienceCard
                  experience={experience}
                  locale={locale}
                  // Le hub affiche les univers au-dessus : leur première image est l'élément LCP.
                  priority={index === 0 && !showsUniverses}
                />
              </li>
            ))}
          </ul>
        </section>
      </Container>
    </div>
  );
};
