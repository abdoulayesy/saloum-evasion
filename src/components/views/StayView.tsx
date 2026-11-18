import { BookOnline } from '@/components/checkout/BookOnline';
import { RichText } from '@payloadcms/richtext-lexical/react';
import { getTranslations } from 'next-intl/server';
import { StayCard } from '@/components/cards/StayCard';
import { Gallery } from '@/components/client/Gallery';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Chip } from '@/components/ui/Chip';
import { CmsImage, HERO_SIZES } from '@/components/ui/CmsImage';
import { Container } from '@/components/ui/Container';
import { MapIllustration } from '@/components/ui/MapIllustration';
import { MaybeLink } from '@/components/ui/MaybeLink';
import { Price } from '@/components/ui/Price';
import { ActionBarSpacer, StickyActionBar } from '@/components/ui/StickyActionBar';
import { buildPath } from '@/i18n/pathnames';
import type { Locale } from '@/i18n/routing';
import { accommodationPath, destinationPath } from '@/lib/catalogPaths';
import { populated, populatedList } from '@/lib/cms/populated';
import { experiencePath } from '@/lib/experiencePaths';
import { bookAction, primaryAction, whatsappAction } from '@/lib/pageActions';
import { priceFrom } from '@/lib/pricing';
import { lexicalToPlainText } from '@/lib/richText';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildBreadcrumbList } from '@/lib/seo/jsonld/breadcrumb';
import { buildFaqPage } from '@/lib/seo/jsonld/faq';
import { buildGraph } from '@/lib/seo/jsonld/graph';
import { buildOrganization } from '@/lib/seo/jsonld/organization';
import { buildTouristTrip } from '@/lib/seo/jsonld/touristTrip';
import { selectSimilarStays } from '@/lib/similarStays';
import { absoluteUrl, siteUrl, type SiteSettings } from '@/lib/site';
import type {
  Accommodation,
  CancellationPolicy,
  Destination,
  Experience,
  FaqItem,
  Media,
  Stay,
} from '@/payload-types';

type StayViewProps = {
  stay: Stay;
  locale: Locale;
  settings: SiteSettings;
  allStays: readonly Stay[];
  allDestinations: readonly Destination[];
};

const imageUrl = (media: Media | null): string[] =>
  media?.url ? [media.url.startsWith('http') ? media.url : absoluteUrl(media.url)] : [];

// Fiche séjour (T080, FR-002) : H1, image principale prioritaire, prix « à partir de » avec
// conditions d'annulation à proximité, programme, inclus / non inclus, galerie, carte, FAQ,
// séjours similaires, fil d'Ariane et barre collante. Rendue côté serveur (constitution III).
export const StayView = async ({
  stay,
  locale,
  settings,
  allStays,
  allDestinations,
}: StayViewProps) => {
  const t = await getTranslations({ locale, namespace: 'stay' });
  const tMoods = await getTranslations({ locale, namespace: 'moods' });
  const tGallery = await getTranslations({ locale, namespace: 'gallery' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const tActions = await getTranslations({ locale, namespace: 'actions' });
  const slug = stay.seo?.slug ?? '';
  const path = buildPath(locale, { type: 'stay', slug });
  const url = absoluteUrl(path);
  const origin = siteUrl();

  const hero = populated<Media>(stay.heroImage);
  const gallery = populatedList<Media>(stay.gallery);
  const policy = populated<CancellationPolicy>(stay.cancellationPolicy);
  const destinations = populatedList<Destination>(stay.destinations);
  const accommodations = populatedList<Accommodation>(stay.accommodations);
  const experiences = populatedList<Experience>(stay.experiences);
  const faq = populatedList<FaqItem>(stay.faq).filter((item) => item.question);
  const amount = priceFrom(stay.pricing.lowSeasonPerPerson, stay.pricing.highSeasonPerPerson);
  const moods = (stay.moods ?? []).map((mood) => tMoods(mood));
  const itinerary = (stay.itinerary ?? []).map((day) => ({
    day: day.day,
    title: day.title ?? t('day', { day: day.day }),
    description: day.description ?? '',
  }));

  const destinationIds = destinations.map((destination) => destination.id);
  const similar = selectSimilarStays(
    { id: stay.id, destinationIds, moods: stay.moods ?? [], featured: Boolean(stay.featured) },
    allStays.map((candidate) => ({
      ...candidate,
      destinationIds: populatedList<Destination>(candidate.destinations).map((d) => d.id),
      moods: candidate.moods ?? [],
      featured: Boolean(candidate.featured),
    })),
    populatedList<Stay>(stay.similarStays).map((candidate) => candidate.id),
  );

  const crumbs = buildBreadcrumbs({
    locale,
    route: { type: 'stay', slug },
    currentName: stay.title ?? slug,
  });
  const graph = buildGraph([
    buildOrganization(settings, origin),
    buildBreadcrumbList(crumbs, url, origin),
    buildTouristTrip({
      url,
      origin,
      locale,
      name: stay.title ?? '',
      description: stay.seo?.metaDescription ?? stay.summary ?? '',
      images: [...imageUrl(hero), ...gallery.slice(0, 3).flatMap((media) => imageUrl(media))],
      touristTypes: moods,
      itinerary: itinerary.map((day) => ({
        ...day,
        title: `${t('day', { day: day.day })} — ${day.title}`,
      })),
      priceFromXof: amount,
      hasFaq: faq.length > 0,
    }),
    ...(faq.length > 0
      ? [
          buildFaqPage(
            url,
            faq.map((item) => ({
              question: item.question ?? '',
              answer: lexicalToPlainText(item.answer),
            })),
          ),
        ]
      : []),
  ]);

  const bookable = stay.bookable === true;
  const [primary, whatsapp] = await Promise.all([
    bookable ? bookAction(locale) : primaryAction(locale, 'stay', slug, stay.title ?? slug),
    whatsappAction(locale, settings, { title: stay.title ?? undefined, path }),
  ]);

  return (
    <article>
      <JsonLd graph={graph} />
      <Breadcrumbs crumbs={crumbs} label={tCommon('breadcrumbLabel')} />

      <Container className="pt-4">
        <p className="text-sm font-semibold tracking-wide text-ocre uppercase">
          {t('nights', { count: stay.durationNights })}
        </p>
        <h1 className="mt-1 text-mangrove">{stay.title}</h1>
        {stay.summary && <p className="mt-3 text-lg text-ink-muted">{stay.summary}</p>}
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

      <Container className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-10">
          <section aria-labelledby="en-bref">
            <h2 id="en-bref" className="sr-only">
              {t('keyFacts')}
            </h2>
            <div className="flex flex-col gap-3 rounded-card bg-white p-4">
              <Price locale={locale} amountXof={amount} unit="perPerson" size="lg" />
              {stay.pricing.basis && (
                <p className="text-sm text-ink-muted">
                  {t('basis')} : {stay.pricing.basis}
                </p>
              )}
              {policy?.summary && (
                <p className="text-sm">
                  <strong>{t('cancellation')} :</strong> {policy.summary}
                </p>
              )}
              <ul className="flex flex-wrap gap-2" aria-label={t('moods')}>
                {moods.map((mood) => (
                  <li key={mood}>
                    <Chip>{mood}</Chip>
                  </li>
                ))}
              </ul>
              {destinations.length > 0 && (
                <p className="text-sm">
                  <strong>{t('destinations')} :</strong>{' '}
                  {destinations.map((destination, index) => (
                    <span key={destination.id}>
                      {index > 0 && ', '}
                      <MaybeLink href={destinationPath(locale, destination)}>
                        {destination.name}
                      </MaybeLink>
                    </span>
                  ))}
                </p>
              )}
              {stay.maxTravellers && (
                <p className="text-sm">{t('maxTravellers', { count: stay.maxTravellers })}</p>
              )}
            </div>
          </section>
          {bookable && (
            <BookOnline
              locale={locale}
              offer={{ offerType: 'stay', id: stay.id, maxGuests: stay.maxTravellers ?? 12 }}
            />
          )}

          {stay.body && (
            <section aria-labelledby="le-sejour">
              <h2 id="le-sejour" className="text-mangrove">
                {t('about')}
              </h2>
              <div className="rich-text mt-4">
                <RichText data={stay.body} />
              </div>
            </section>
          )}

          {itinerary.length > 0 && (
            <section aria-labelledby="programme">
              <h2 id="programme" className="text-mangrove">
                {t('itinerary')}
              </h2>
              <ol className="mt-4 flex flex-col gap-4 border-l-2 border-ocre pl-4">
                {itinerary.map((day) => (
                  <li key={day.day}>
                    <h3 className="text-xl">
                      {t('day', { day: day.day })} — {day.title}
                    </h3>
                    {day.description && <p className="mt-1 text-ink-muted">{day.description}</p>}
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section aria-labelledby="inclus" className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h2 id="inclus" className="text-2xl text-mangrove">
                {t('included')}
              </h2>
              <ul className="mt-3 flex list-disc flex-col gap-1 pl-5">
                {(stay.included ?? []).map((entry) =>
                  entry.item ? <li key={entry.id ?? entry.item}>{entry.item}</li> : null,
                )}
              </ul>
            </div>
            {(stay.notIncluded ?? []).length > 0 && (
              <div>
                <h2 className="text-2xl text-mangrove">{t('notIncluded')}</h2>
                <ul className="mt-3 flex list-disc flex-col gap-1 pl-5">
                  {(stay.notIncluded ?? []).map((entry) =>
                    entry.item ? <li key={entry.id ?? entry.item}>{entry.item}</li> : null,
                  )}
                </ul>
              </div>
            )}
          </section>

          {policy && (
            <section aria-labelledby="annulation">
              <h2 id="annulation" className="text-mangrove">
                {t('cancellation')}
              </h2>
              {policy.summary && <p className="mt-3">{policy.summary}</p>}
              {policy.details && (
                <div className="rich-text mt-3 text-ink-muted">
                  <RichText data={policy.details} />
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-8">
          {(accommodations.length > 0 || experiences.length > 0) && (
            <div className="flex flex-col gap-6">
              {accommodations.length > 0 && (
                <section aria-labelledby="hebergements">
                  <h2 id="hebergements" className="text-2xl text-mangrove">
                    {t('accommodations')}
                  </h2>
                  <ul className="mt-2 flex flex-col gap-1">
                    {accommodations.map((item) => (
                      <li key={item.id}>
                        <MaybeLink href={accommodationPath(locale, item)}>{item.title}</MaybeLink>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {experiences.length > 0 && (
                <section aria-labelledby="experiences">
                  <h2 id="experiences" className="text-2xl text-mangrove">
                    {t('experiences')}
                  </h2>
                  <ul className="mt-2 flex flex-col gap-1">
                    {experiences.map((item) => (
                      <li key={item.id}>
                        <MaybeLink href={experiencePath(locale, item)}>{item.title}</MaybeLink>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
          <section aria-labelledby="carte">
            <h2 id="carte" className="text-2xl text-mangrove">
              {t('map')}
            </h2>
            <div className="mt-3">
              <MapIllustration
                title={t('map')}
                description={destinations.map((destination) => destination.name).join(', ')}
                points={allDestinations.map((destination) => ({
                  id: destination.id,
                  name: destination.name ?? '',
                  latitude: destination.geo.latitude,
                  longitude: destination.geo.longitude,
                  highlighted: destinationIds.includes(destination.id),
                }))}
              />
            </div>
          </section>
        </aside>
      </Container>

      {gallery.length > 0 && (
        <section aria-labelledby="photos" className="mt-10">
          <Container>
            <h2 id="photos" className="text-mangrove">
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

      {faq.length > 0 && (
        <Container className="mt-10">
          <section aria-labelledby="faq">
            <h2 id="faq" className="text-mangrove">
              {t('faq')}
            </h2>
            <div className="mt-4 flex flex-col gap-2">
              {faq.map((item) => (
                <details key={item.id} className="rounded-card bg-white p-4">
                  <summary className="flex min-h-touch cursor-pointer items-center font-semibold">
                    {item.question}
                  </summary>
                  {item.answer && (
                    <div className="rich-text mt-2 text-ink-muted">
                      <RichText data={item.answer} />
                    </div>
                  )}
                </details>
              ))}
            </div>
          </section>
        </Container>
      )}

      {similar.length > 0 && (
        <Container className="mt-10">
          <section aria-labelledby="similaires">
            <h2 id="similaires" className="text-mangrove">
              {t('similar')}
            </h2>
            <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((candidate) => (
                <li key={candidate.id}>
                  <StayCard stay={candidate} locale={locale} />
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
