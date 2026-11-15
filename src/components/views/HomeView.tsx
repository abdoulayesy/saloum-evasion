import { getTranslations } from 'next-intl/server';
import { DestinationCard } from '@/components/cards/DestinationCard';
import { AmbientLoop } from '@/components/client/AmbientLoop';
import { StayCard } from '@/components/cards/StayCard';
import { JsonLd } from '@/components/seo/JsonLd';
import { ButtonLink } from '@/components/ui/Button';
import { CARD_QUALITY, CmsImage, HERO_SIZES } from '@/components/ui/CmsImage';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { buildPath } from '@/i18n/pathnames';
import type { Locale } from '@/i18n/routing';
import { populated } from '@/lib/cms/populated';
import { whatsappAction } from '@/lib/pageActions';
import { buildGraph } from '@/lib/seo/jsonld/graph';
import { buildOrganization } from '@/lib/seo/jsonld/organization';
import { buildWebSite } from '@/lib/seo/jsonld/website';
import { siteUrl, type SiteSettings } from '@/lib/site';
import type { Destination, Media, Page, SiteSetting, Stay, Universe } from '@/payload-types';
import { HOME_SEARCH_ID, HomeSearch } from './HomeSearch';

type HomeViewProps = {
  locale: Locale;
  page: Page | null;
  settings: SiteSettings;
  settingsGlobal: SiteSetting;
  featured: readonly Stay[];
  universes: readonly Universe[];
  destinations: readonly Destination[];
  /** Boucle d'ambiance (rendu MP4 basse définition), ordinateur seulement. */
  ambientLoopSrc: string | null;
};

/** Image du héro : bloc « Héro » de la page d'accueil, sinon image du premier séjour vedette. */
const heroImage = (page: Page | null, featured: readonly Stay[]): Media | null => {
  for (const block of page?.blocks ?? []) {
    if (block.blockType === 'hero') return populated<Media>(block.image);
  }
  const [first] = featured;
  return first ? populated<Media>(first.heroImage) : null;
};

// Accueil (T095, FR-001) : héro image prioritaire (élément LCP) et promesse, recherche,
// engagements, séjours signature, univers, destinations, étapes, engagement local, WhatsApp.
// Les sections renvoient vers les pages déjà livrées ; le film arrive avec sa page (phase 7).
export const HomeView = async ({
  locale,
  page,
  settings,
  settingsGlobal,
  featured,
  universes,
  destinations,
  ambientLoopSrc,
}: HomeViewProps) => {
  const t = await getTranslations({ locale, namespace: 'home' });
  const tActions = await getTranslations({ locale, namespace: 'actions' });
  const tAmbient = await getTranslations({ locale, namespace: 'ambient' });
  const origin = siteUrl();
  const graph = buildGraph([
    buildOrganization(settings, origin),
    buildWebSite(origin, locale, settings.brandName),
  ]);
  const hero = heroImage(page, featured);
  const whatsapp = await whatsappAction(locale, settings, {
    path: buildPath(locale, { type: 'home' }),
  });
  const guarantees = (settingsGlobal.guarantees ?? []).filter((item) => item.title);

  return (
    <>
      <JsonLd graph={graph} />
      <section
        aria-labelledby="accueil-titre"
        className="relative isolate overflow-hidden bg-mangrove text-sable"
      >
        <CmsImage
          media={hero}
          locale={locale}
          sizes={HERO_SIZES}
          priority
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        {ambientLoopSrc && (
          <AmbientLoop
            src={ambientLoopSrc}
            pauseLabel={tAmbient('pause')}
            playLabel={tAmbient('play')}
          />
        )}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-scrim" />
        <Container className="flex min-h-[70dvh] flex-col justify-end gap-4 py-10">
          <p className="text-sm font-semibold tracking-wide uppercase">Ndangane · Sine-Saloum</p>
          <h1 id="accueil-titre" className="text-sable">
            {page?.title || t('heading')}
          </h1>
          <p className="max-w-xl text-lg">{t('lead')}</p>
          <a
            href={`#${HOME_SEARCH_ID}`}
            className="inline-flex min-h-touch w-full items-center justify-center rounded-control bg-sable px-6 font-semibold text-mangrove sm:w-auto sm:self-start"
          >
            {t('findStay')}
          </a>
        </Container>
      </section>

      <Container className="relative -mt-6">
        <HomeSearch locale={locale} />
      </Container>

      {guarantees.length > 0 && (
        <Section id="engagements" title={t('guarantees')}>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guarantees.map((item) => (
              <li key={item.id ?? item.title} className="rounded-card bg-white p-4">
                <h3 className="text-xl">{item.title}</h3>
                {item.text && <p className="mt-1 text-ink-muted">{item.text}</p>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {featured.length > 0 && (
        <Section id="vedettes" title={t('featured')} tone="deep">
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((stay) => (
              <li key={stay.id}>
                <StayCard stay={stay} locale={locale} />
              </li>
            ))}
          </ul>
          <ButtonLink
            href={buildPath(locale, { type: 'staysList' })}
            variant="secondary"
            className="mt-6"
          >
            {tActions('discoverStays')}
          </ButtonLink>
        </Section>
      )}

      {universes.length > 0 && (
        <Section id="univers" title={t('universes')}>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {universes.map((universe) => (
              <li key={universe.id} className="overflow-hidden rounded-card bg-white">
                <CmsImage
                  media={populated<Media>(universe.image)}
                  locale={locale}
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, (min-width: 400px) 360px, calc(100vw - 2rem)"
                  quality={CARD_QUALITY}
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="p-4">
                  <h3 className="text-xl">{universe.name}</h3>
                  {universe.intro && <p className="mt-1 text-ink-muted">{universe.intro}</p>}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {destinations.length > 0 && (
        <Section id="destinations" title={t('destinations')} tone="deep">
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map((destination) => (
              <li key={destination.id}>
                <DestinationCard destination={destination} locale={locale} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section id="etapes" title={t('steps')}>
        <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[t('step1'), t('step2'), t('step3')].map((step, index) => (
            <li key={step} className="flex gap-3 rounded-card bg-white p-4">
              <span aria-hidden="true" className="font-serif text-3xl text-ocre">
                {index + 1}
              </span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="engagement" title={t('commitment')} tone="deep">
        <p className="max-w-2xl text-lg">{t('commitmentText')}</p>
      </Section>

      {whatsapp && (
        <Section id="contact" title={t('contact')}>
          <p className="text-ink-muted">{settings.responseTimeText}</p>
          <ButtonLink
            href={whatsapp.href}
            variant="whatsapp"
            external
            ariaLabel={whatsapp.ariaLabel}
            className="mt-4"
          >
            {whatsapp.label}
          </ButtonLink>
        </Section>
      )}
    </>
  );
};
