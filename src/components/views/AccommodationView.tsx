import { BookOnline } from '@/components/checkout/BookOnline';
import Link from 'next/link';
import { RichText } from '@payloadcms/richtext-lexical/react';
import { getTranslations } from 'next-intl/server';
import { AccommodationCard } from '@/components/cards/AccommodationCard';
import { StayCard } from '@/components/cards/StayCard';
import { Gallery } from '@/components/client/Gallery';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CmsImage, HERO_SIZES } from '@/components/ui/CmsImage';
import { Container } from '@/components/ui/Container';
import { Price } from '@/components/ui/Price';
import { ActionBarSpacer, StickyActionBar } from '@/components/ui/StickyActionBar';
import type { Locale } from '@/i18n/routing';
import { accommodationPath, destinationPath, relationId } from '@/lib/catalogPaths';
import { populated, populatedList } from '@/lib/cms/populated';
import { bookAction, primaryAction, whatsappAction } from '@/lib/pageActions';
import { formatXof } from '@/lib/pricing';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildBreadcrumbList } from '@/lib/seo/jsonld/breadcrumb';
import { buildGraph } from '@/lib/seo/jsonld/graph';
import { buildLodging } from '@/lib/seo/jsonld/lodging';
import { buildOrganization } from '@/lib/seo/jsonld/organization';
import { absoluteUrl, siteUrl, type SiteSettings } from '@/lib/site';
import type { Accommodation, Destination, Media, Stay } from '@/payload-types';

type AccommodationViewProps = {
  accommodation: Accommodation;
  locale: Locale;
  settings: SiteSettings;
  allAccommodations: readonly Accommodation[];
  allStays: readonly Stay[];
};

const imageUrl = (media: Media | null): string[] =>
  media?.url ? [media.url.startsWith('http') ? media.url : absoluteUrl(media.url)] : [];

// Fiche hébergement (T119, FR-004) : capacité, chambres, équipements, prix par nuit, photos,
// emplacement (lien vers la destination), séjours qui l'incluent, hébergements de la même
// destination ; JSON-LD LodgingBusiness ou VacationRental ; barre collante.
export const AccommodationView = async ({
  accommodation,
  locale,
  settings,
  allAccommodations,
  allStays,
}: AccommodationViewProps) => {
  const t = await getTranslations({ locale, namespace: 'accommodation' });
  const tPrice = await getTranslations({ locale, namespace: 'price' });
  const tGallery = await getTranslations({ locale, namespace: 'gallery' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const tActions = await getTranslations({ locale, namespace: 'actions' });
  const path = accommodationPath(locale, accommodation) ?? '';
  const url = absoluteUrl(path);
  const origin = siteUrl();
  const destination = populated<Destination>(accommodation.destination);
  const destinationHref = destination ? destinationPath(locale, destination) : null;
  const hero = populated<Media>(accommodation.heroImage);
  const gallery = populatedList<Media>(accommodation.gallery);
  const amenities = (accommodation.amenities ?? []).map((amenity) => t(`amenityLabels.${amenity}`));

  const inStays = allStays.filter((stay) =>
    (stay.accommodations ?? []).some((item) => relationId(item) === accommodation.id),
  );
  const neighbours = allAccommodations
    .filter(
      (other) =>
        other.id !== accommodation.id &&
        relationId(other.destination) === relationId(accommodation.destination),
    )
    .slice(0, 3);

  const crumbs = buildBreadcrumbs({
    locale,
    route: { type: 'accommodation', slug: accommodation.seo?.slug ?? '' },
    currentName: accommodation.title ?? '',
  });
  const graph = buildGraph([
    buildOrganization(settings, origin),
    buildBreadcrumbList(crumbs, url, origin),
    buildLodging({
      url,
      origin,
      type: accommodation.type,
      name: accommodation.title ?? '',
      description: accommodation.seo?.metaDescription ?? accommodation.summary ?? '',
      images: [...imageUrl(hero), ...gallery.flatMap((media) => imageUrl(media))],
      locality: destination?.name ?? accommodation.address ?? '',
      latitude: accommodation.geo.latitude,
      longitude: accommodation.geo.longitude,
      amenities,
      bedrooms: accommodation.bedrooms ?? null,
      capacity: accommodation.capacity,
      identifier: accommodation.identifier ?? null,
      priceRange: `${tPrice('from')} ${formatXof(accommodation.priceFromPerNight)} / ${tPrice('perNight')}`,
      destinationUrl: destinationHref ? absoluteUrl(destinationHref) : null,
    }),
  ]);

  const bookable = accommodation.bookable === true;
  const [primary, whatsapp] = await Promise.all([
    bookable
      ? bookAction(locale)
      : primaryAction(
          locale,
          'accommodation',
          accommodation.seo?.slug ?? '',
          accommodation.title ?? '',
        ),
    whatsappAction(locale, settings, { title: accommodation.title ?? undefined, path }),
  ]);

  return (
    <article>
      <JsonLd graph={graph} />
      <Breadcrumbs crumbs={crumbs} label={tCommon('breadcrumbLabel')} />

      <Container className="pt-4">
        <p className="text-sm font-semibold tracking-wide text-ocre uppercase">
          {t(`type.${accommodation.type}`)}
          {destination?.name ? ` · ${destination.name}` : ''}
        </p>
        <h1 className="mt-1 text-mangrove">{accommodation.title}</h1>
        <section aria-labelledby="hebergement-essentiel" className="mt-4 rounded-card bg-white p-4">
          <h2 id="hebergement-essentiel" className="sr-only">
            {t('about')}
          </h2>
          <p className="font-semibold">
            {t('capacity', { count: accommodation.capacity })}
            {accommodation.bedrooms ? ` · ${t('bedrooms', { count: accommodation.bedrooms })}` : ''}
          </p>
          <div className="mt-2">
            <Price locale={locale} amountXof={accommodation.priceFromPerNight} unit="perNight" />
          </div>
        </section>
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
        <div className="flex flex-col gap-10">
          {accommodation.summary && (
            <p className="text-lg text-ink-muted">{accommodation.summary}</p>
          )}
          {bookable && (
            <BookOnline
              locale={locale}
              offer={{
                offerType: 'accommodation',
                id: accommodation.id,
                maxGuests: accommodation.capacity,
              }}
              cancellationSummary={
                typeof accommodation.cancellationPolicy === 'object'
                  ? accommodation.cancellationPolicy?.summary
                  : null
              }
            />
          )}
          {accommodation.body && (
            <section aria-labelledby="hebergement-texte">
              <h2 id="hebergement-texte" className="text-mangrove">
                {t('about')}
              </h2>
              <div className="rich-text mt-4">
                <RichText data={accommodation.body} />
              </div>
            </section>
          )}
        </div>
        <aside className="flex flex-col gap-8">
          {amenities.length > 0 && (
            <section aria-labelledby="hebergement-equipements">
              <h2 id="hebergement-equipements" className="text-2xl text-mangrove">
                {t('amenities')}
              </h2>
              <ul className="mt-3 flex list-disc flex-col gap-1 pl-5">
                {amenities.map((amenity) => (
                  <li key={amenity}>{amenity}</li>
                ))}
              </ul>
            </section>
          )}
          <section aria-labelledby="hebergement-lieu">
            <h2 id="hebergement-lieu" className="text-2xl text-mangrove">
              {t('location')}
            </h2>
            <p className="mt-2">{accommodation.address}</p>
            {destination?.name && destinationHref && (
              <Link
                href={destinationHref}
                className="mt-1 inline-flex min-h-touch min-w-touch items-center underline underline-offset-4"
              >
                {destination.name}
              </Link>
            )}
          </section>
        </aside>
      </Container>

      {gallery.length > 0 && (
        <section aria-labelledby="hebergement-photos" className="mt-10">
          <Container>
            <h2 id="hebergement-photos" className="text-mangrove">
              {t('gallery')}
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

      {inStays.length > 0 && (
        <Container className="mt-10">
          <section aria-labelledby="hebergement-sejours">
            <h2 id="hebergement-sejours" className="text-mangrove">
              {t('inStays')}
            </h2>
            <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {inStays.slice(0, 3).map((stay) => (
                <li key={stay.id}>
                  <StayCard stay={stay} locale={locale} />
                </li>
              ))}
            </ul>
          </section>
        </Container>
      )}

      {neighbours.length > 0 && destination?.name && (
        <Container className="mt-10">
          <section aria-labelledby="hebergement-voisins">
            <h2 id="hebergement-voisins" className="text-mangrove">
              {t('sameDestination', { place: destination.name })}
            </h2>
            <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {neighbours.map((other) => (
                <li key={other.id}>
                  <AccommodationCard accommodation={other} locale={locale} />
                </li>
              ))}
            </ul>
          </section>
        </Container>
      )}

      <StickyActionBar primary={primary} whatsapp={whatsapp} label={tActions('barLabel')} />
      <ActionBarSpacer />
    </article>
  );
};
