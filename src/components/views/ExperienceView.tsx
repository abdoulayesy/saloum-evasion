import { BookOnline } from '@/components/checkout/BookOnline';
import { RichText } from '@payloadcms/richtext-lexical/react';
import { GuidesTeaser } from '@/components/guides/GuidesTeaser';
import { getTranslations } from 'next-intl/server';
import { ExperienceCard } from '@/components/cards/ExperienceCard';
import { StayCard } from '@/components/cards/StayCard';
import { Gallery } from '@/components/client/Gallery';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CmsImage, HERO_SIZES } from '@/components/ui/CmsImage';
import { Container } from '@/components/ui/Container';
import { MaybeLink } from '@/components/ui/MaybeLink';
import { Price } from '@/components/ui/Price';
import { ActionBarSpacer, StickyActionBar } from '@/components/ui/StickyActionBar';
import type { Locale } from '@/i18n/routing';
import { destinationPath } from '@/lib/catalogPaths';
import { populated, populatedList } from '@/lib/cms/populated';
import { experiencePath } from '@/lib/experiencePaths';
import { formatDuration, formatSeason } from '@/lib/format';
import { bookAction, primaryAction, whatsappAction } from '@/lib/pageActions';
import { lexicalToPlainText } from '@/lib/richText';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildBreadcrumbList } from '@/lib/seo/jsonld/breadcrumb';
import { buildFaqPage } from '@/lib/seo/jsonld/faq';
import { buildGraph } from '@/lib/seo/jsonld/graph';
import { buildOrganization } from '@/lib/seo/jsonld/organization';
import { buildExperienceTrip, buildTouristAttraction } from '@/lib/seo/jsonld/touristAttraction';
import { absoluteUrl, siteUrl, type SiteSettings } from '@/lib/site';
import type { Destination, Experience, FaqItem, Media, Stay, Universe } from '@/payload-types';

type ExperienceViewProps = {
  experience: Experience;
  locale: Locale;
  settings: SiteSettings;
  allExperiences: readonly Experience[];
  allStays: readonly Stay[];
};

const MONTH_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] as const;

const imageUrl = (media: Media | null): string[] =>
  media?.url ? [media.url.startsWith('http') ? media.url : absoluteUrl(media.url)] : [];

const relationId = (value: number | { id: number } | null | undefined): number | null =>
  typeof value === 'number' ? value : (value?.id ?? null);

// Fiche expérience (T102, FR-003) : faits clés et prix dans le premier écran à 360 × 800
// (mobile CHK003), puis texte, galerie, destination, séjours qui l'incluent, expériences de
// la même destination, FAQ ; fil d'Ariane à 4 niveaux et barre collante.
export const ExperienceView = async ({
  experience,
  locale,
  settings,
  allExperiences,
  allStays,
}: ExperienceViewProps) => {
  const t = await getTranslations({ locale, namespace: 'experience' });
  const tMonths = await getTranslations({ locale, namespace: 'months' });
  const tGallery = await getTranslations({ locale, namespace: 'gallery' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const tActions = await getTranslations({ locale, namespace: 'actions' });
  const path = experiencePath(locale, experience) ?? '';
  const url = absoluteUrl(path);
  const origin = siteUrl();

  const universe = populated<Universe>(experience.universe);
  const destination = populated<Destination>(experience.destination);
  const hero = populated<Media>(experience.heroImage);
  const gallery = populatedList<Media>(experience.gallery);
  const faq = populatedList<FaqItem>(experience.faq).filter((item) => item.question);
  const season = formatSeason(
    (experience.seasonMonths ?? []).map(Number),
    (month) => {
      const key = MONTH_KEYS.find((candidate) => candidate === String(month));
      return key ? tMonths(key) : '';
    },
    { allYear: t('allYear'), range: (from, to) => t('seasonRange', { from, to }) },
  );

  const destinationId = destination?.id ?? null;
  const sameDestination = allExperiences
    .filter(
      (other) => other.id !== experience.id && relationId(other.destination) === destinationId,
    )
    .slice(0, 3);
  const inStays = allStays.filter((stay) =>
    (stay.experiences ?? []).some((item) => relationId(item) === experience.id),
  );

  const crumbs = buildBreadcrumbs({
    locale,
    route: {
      type: 'experience',
      universe: universe?.seo?.slug ?? '',
      slug: experience.seo?.slug ?? '',
    },
    currentName: experience.title ?? '',
    universeName: universe?.name ?? undefined,
  });
  const attractionInput = {
    url,
    origin,
    name: experience.title ?? '',
    description: experience.seo?.metaDescription ?? experience.summary ?? '',
    images: [...imageUrl(hero), ...gallery.slice(0, 3).flatMap((media) => imageUrl(media))],
    universeName: universe?.name ?? null,
    destination: destination
      ? {
          name: destination.name ?? '',
          latitude: destination.geo.latitude,
          longitude: destination.geo.longitude,
          url: destinationPath(locale, destination)
            ? absoluteUrl(destinationPath(locale, destination) ?? '')
            : undefined,
        }
      : null,
    pricePerPersonXof: experience.pricePerPerson,
    hasFaq: faq.length > 0,
  };
  const graph = buildGraph([
    buildOrganization(settings, origin),
    buildBreadcrumbList(crumbs, url, origin),
    buildTouristAttraction(attractionInput),
    buildExperienceTrip(attractionInput),
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

  const bookable = experience.bookable === true && (experience.slots ?? []).length > 0;
  const [primary, whatsapp] = await Promise.all([
    bookable
      ? bookAction(locale)
      : primaryAction(locale, 'experience', experience.seo?.slug ?? '', experience.title ?? ''),
    whatsappAction(locale, settings, { title: experience.title ?? undefined, path }),
  ]);

  const facts: { label: string; value: string }[] = [
    { label: t('duration'), value: formatDuration(experience.durationMinutes) },
    { label: t('level'), value: t(`levels.${experience.level}`) },
    ...(season ? [{ label: t('season'), value: season }] : []),
    ...(experience.meetingPoint
      ? [{ label: t('meetingPoint'), value: experience.meetingPoint }]
      : []),
  ];

  return (
    <article>
      <JsonLd graph={graph} />
      <Breadcrumbs crumbs={crumbs} label={tCommon('breadcrumbLabel')} />

      <Container className="pt-4">
        {universe?.name && (
          <p className="text-sm font-semibold tracking-wide text-ocre uppercase">{universe.name}</p>
        )}
        <h1 className="mt-1 text-mangrove">{experience.title}</h1>

        <section aria-labelledby="essentiel" className="mt-4 rounded-card bg-white p-4">
          <h2 id="essentiel" className="sr-only">
            {t('keyFacts')}
          </h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            {facts.map((fact) => (
              <div key={fact.label} className="min-w-0">
                <dt className="text-sm text-ink-muted">{fact.label}</dt>
                <dd className="font-semibold [overflow-wrap:anywhere]">{fact.value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 border-t border-sable-deep pt-3">
            <Price
              locale={locale}
              amountXof={experience.pricePerPerson}
              unit="perPerson"
              from={false}
            />
            {(experience.minParticipants ?? 1) > 1 && (
              <p className="text-sm text-ink-muted">
                {t('minParticipants', { count: experience.minParticipants ?? 1 })}
              </p>
            )}
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
          {experience.summary && <p className="text-lg text-ink-muted">{experience.summary}</p>}
          {bookable && (
            <BookOnline
              locale={locale}
              offer={{
                offerType: experience.offerKind === 'table' ? 'table' : 'experience',
                id: experience.id,
                maxGuests: experience.maxParticipants,
                slots: (experience.slots ?? []).map((slot) => ({
                  label: slot.label ?? slot.startTime,
                  startTime: slot.startTime,
                })),
              }}
              cancellationSummary={
                typeof experience.cancellationPolicy === 'object'
                  ? experience.cancellationPolicy?.summary
                  : null
              }
            />
          )}
          {experience.body && (
            <section aria-labelledby="experience-texte">
              <h2 id="experience-texte" className="text-mangrove">
                {t('about')}
              </h2>
              <div className="rich-text mt-4">
                <RichText data={experience.body} />
              </div>
            </section>
          )}
        </div>
        <aside className="flex flex-col gap-6">
          {destination?.name && (
            <section aria-labelledby="experience-lieu">
              <h2 id="experience-lieu" className="text-2xl text-mangrove">
                {t('destination')}
              </h2>
              <p className="mt-2">
                <MaybeLink href={destinationPath(locale, destination)}>
                  {destination.name}
                </MaybeLink>
              </p>
              {destination.intro && <p className="mt-1 text-ink-muted">{destination.intro}</p>}
            </section>
          )}
        </aside>
      </Container>

      {gallery.length > 0 && (
        <section aria-labelledby="experience-photos" className="mt-10">
          <Container>
            <h2 id="experience-photos" className="text-mangrove">
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
          <section aria-labelledby="experience-faq">
            <h2 id="experience-faq" className="text-mangrove">
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

      {/* 004 (US2) : guides des Carnets du Saloum liés à la fiche. */}
      <GuidesTeaser collection="experiences" id={experience.id} locale={locale} from="experience" />

      {inStays.length > 0 && (
        <Container className="mt-10">
          <section aria-labelledby="experience-sejours">
            <h2 id="experience-sejours" className="text-mangrove">
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

      {sameDestination.length > 0 && destination?.name && (
        <Container className="mt-10">
          <section aria-labelledby="experience-voisines">
            <h2 id="experience-voisines" className="text-mangrove">
              {t('sameDestination', { place: destination.name })}
            </h2>
            <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sameDestination.map((other) => (
                <li key={other.id}>
                  <ExperienceCard experience={other} locale={locale} />
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
