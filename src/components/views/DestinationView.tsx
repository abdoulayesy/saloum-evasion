import { RichText } from '@payloadcms/richtext-lexical/react';
import { getTranslations } from 'next-intl/server';
import { GuidesTeaser } from '@/components/guides/GuidesTeaser';
import { AccommodationCard } from '@/components/cards/AccommodationCard';
import { ExperienceCard } from '@/components/cards/ExperienceCard';
import { StayCard } from '@/components/cards/StayCard';
import { Gallery } from '@/components/client/Gallery';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CmsImage, HERO_SIZES } from '@/components/ui/CmsImage';
import { Container } from '@/components/ui/Container';
import { MapIllustration } from '@/components/ui/MapIllustration';
import { ActionBarSpacer, StickyActionBar } from '@/components/ui/StickyActionBar';
import type { Locale } from '@/i18n/routing';
import { destinationPath, relationId } from '@/lib/catalogPaths';
import { populated, populatedList } from '@/lib/cms/populated';
import { experiencePath } from '@/lib/experiencePaths';
import { whatsappAction } from '@/lib/pageActions';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildBreadcrumbList } from '@/lib/seo/jsonld/breadcrumb';
import { buildGraph } from '@/lib/seo/jsonld/graph';
import { buildOrganization } from '@/lib/seo/jsonld/organization';
import { buildDestination } from '@/lib/seo/jsonld/touristDestination';
import { absoluteUrl, siteUrl, type SiteSettings } from '@/lib/site';
import type { Accommodation, Destination, Experience, Media, Stay } from '@/payload-types';

type DestinationViewProps = {
  destination: Destination;
  locale: Locale;
  settings: SiteSettings;
  stays: readonly Stay[];
  experiences: readonly Experience[];
  accommodations: readonly Accommodation[];
  allDestinations: readonly Destination[];
};

const STAYS_ANCHOR = 'sejours-du-lieu';

const imageUrl = (media: Media | null): string[] =>
  media?.url ? [media.url.startsWith('http') ? media.url : absoluteUrl(media.url)] : [];

// Page destination (T114, FR-005) : H1, intro, texte, galerie, carte ; séjours, expériences et
// hébergements du lieu (sections masquées si vides : spec « Destination sans contenu lié ») ;
// barre collante « Voir les séjours à {lieu} » + WhatsApp ; fil d'Ariane.
export const DestinationView = async ({
  destination,
  locale,
  settings,
  stays,
  experiences,
  accommodations,
  allDestinations,
}: DestinationViewProps) => {
  const t = await getTranslations({ locale, namespace: 'destination' });
  const tActions = await getTranslations({ locale, namespace: 'actions' });
  const tGallery = await getTranslations({ locale, namespace: 'gallery' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const place = destination.name ?? '';
  const path = destinationPath(locale, destination) ?? '';
  const url = absoluteUrl(path);
  const origin = siteUrl();
  const hero = populated<Media>(destination.heroImage);
  const gallery = populatedList<Media>(destination.gallery);

  const localStays = stays.filter((stay) =>
    (stay.destinations ?? []).some((item) => relationId(item) === destination.id),
  );
  const localExperiences = experiences.filter(
    (experience) => relationId(experience.destination) === destination.id,
  );
  const localAccommodations = accommodations.filter(
    (accommodation) => relationId(accommodation.destination) === destination.id,
  );

  const crumbs = buildBreadcrumbs({
    locale,
    route: { type: 'destination', slug: destination.seo?.slug ?? '' },
    currentName: place,
  });
  const graph = buildGraph([
    buildOrganization(settings, origin),
    buildBreadcrumbList(crumbs, url, origin),
    buildDestination({
      url,
      kind: destination.kind,
      name: place,
      description: destination.seo?.metaDescription ?? destination.intro ?? '',
      images: [...imageUrl(hero), ...gallery.slice(0, 3).flatMap((media) => imageUrl(media))],
      latitude: destination.geo.latitude,
      longitude: destination.geo.longitude,
      attractionUrls: localExperiences.flatMap((experience) => {
        const experienceUrl = experiencePath(locale, experience);
        return experienceUrl ? [absoluteUrl(experienceUrl)] : [];
      }),
    }),
  ]);

  const whatsapp = await whatsappAction(locale, settings, { title: place, path });
  const primary =
    localStays.length > 0
      ? { href: `#${STAYS_ANCHOR}`, label: tActions('seeStaysAt', { place }) }
      : null;

  return (
    <article>
      <JsonLd graph={graph} />
      <Breadcrumbs crumbs={crumbs} label={tCommon('breadcrumbLabel')} />

      <Container className="pt-4">
        <p className="text-sm font-semibold tracking-wide text-ocre uppercase">
          {t(`kinds.${destination.kind}`)}
        </p>
        <h1 className="mt-1 text-mangrove">{place}</h1>
        {destination.intro && <p className="mt-3 text-lg text-ink-muted">{destination.intro}</p>}
      </Container>

      <div className="mx-auto mt-6 max-w-6xl sm:px-8">
        <CmsImage
          media={hero}
          locale={locale}
          sizes={HERO_SIZES}
          priority
          className="aspect-[4/3] w-full object-cover sm:rounded-card md:aspect-[16/7]"
        />
      </div>

      <Container className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {destination.body && (
          <section aria-labelledby="destination-texte">
            <h2 id="destination-texte" className="text-mangrove">
              {t('about', { place })}
            </h2>
            <div className="rich-text mt-4">
              <RichText data={destination.body} />
            </div>
          </section>
        )}
        <section aria-labelledby="destination-carte">
          <h2 id="destination-carte" className="text-2xl text-mangrove">
            {t('map', { place })}
          </h2>
          <div className="mt-3">
            <MapIllustration
              title={t('map', { place })}
              description={place}
              points={allDestinations.map((item) => ({
                id: item.id,
                name: item.name ?? '',
                latitude: item.geo.latitude,
                longitude: item.geo.longitude,
                highlighted: item.id === destination.id,
              }))}
            />
          </div>
        </section>
      </Container>

      {gallery.length > 0 && (
        <section aria-labelledby="destination-photos" className="mt-10">
          <Container>
            <h2 id="destination-photos" className="text-mangrove">
              {tGallery('label')}
            </h2>
          </Container>
          <div className="mx-auto mt-4 max-w-6xl">
            <Gallery
              label={tGallery('label')}
              previousLabel={tGallery('previous')}
              nextLabel={tGallery('next')}
              positionTemplate={tGallery('position', { current: '{current}', total: '{total}' })}
              slides={gallery.map((media) => (
                <CmsImage
                  key={media.id}
                  media={media}
                  locale={locale}
                  sizes="(min-width: 1024px) 45vw, (min-width: 640px) 60vw, 85vw"
                  className="aspect-[4/3] w-full rounded-card object-cover"
                />
              ))}
            />
          </div>
        </section>
      )}

      {localStays.length > 0 && (
        <Container className="mt-10">
          <section id={STAYS_ANCHOR} aria-labelledby={`${STAYS_ANCHOR}-titre`} tabIndex={-1}>
            <h2 id={`${STAYS_ANCHOR}-titre`} className="text-mangrove">
              {t('stays', { place })}
            </h2>
            <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {localStays.map((stay) => (
                <li key={stay.id}>
                  <StayCard stay={stay} locale={locale} />
                </li>
              ))}
            </ul>
          </section>
        </Container>
      )}

      {localExperiences.length > 0 && (
        <Container className="mt-10">
          <section aria-labelledby="destination-experiences">
            <h2 id="destination-experiences" className="text-mangrove">
              {t('experiences', { place })}
            </h2>
            <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {localExperiences.map((experience) => (
                <li key={experience.id}>
                  <ExperienceCard experience={experience} locale={locale} />
                </li>
              ))}
            </ul>
          </section>
        </Container>
      )}

      {localAccommodations.length > 0 && (
        <Container className="mt-10">
          <section aria-labelledby="destination-hebergements">
            <h2 id="destination-hebergements" className="text-mangrove">
              {t('accommodations', { place })}
            </h2>
            <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {localAccommodations.map((accommodation) => (
                <li key={accommodation.id}>
                  <AccommodationCard accommodation={accommodation} locale={locale} />
                </li>
              ))}
            </ul>
          </section>
        </Container>
      )}

      {/* 004 (US2) : guides des Carnets du Saloum liés à la fiche. */}
      <GuidesTeaser
        collection="destinations"
        id={destination.id}
        locale={locale}
        from="destination"
      />

      <StickyActionBar primary={primary} whatsapp={whatsapp} label={tActions('barLabel')} />
      <ActionBarSpacer />
    </article>
  );
};
