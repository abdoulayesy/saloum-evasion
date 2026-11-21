import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { AmbientLoop } from '@/components/client/AmbientLoop';
import { VideoPlayer, type VideoCaption } from '@/components/client/VideoPlayer';
import { JsonLd } from '@/components/seo/JsonLd';
import { CARD_QUALITY, CARD_SIZES, CmsImage } from '@/components/ui/CmsImage';
import { buildPath } from '@/i18n/pathnames';
import type { Locale } from '@/i18n/routing';
import { checkoutPath } from '@/lib/checkout/paths';
import { populated } from '@/lib/cms/populated';
import { whatsappAction } from '@/lib/pageActions';
import { formatXof, priceFrom } from '@/lib/pricing';
import { buildGraph } from '@/lib/seo/jsonld/graph';
import { buildOrganization } from '@/lib/seo/jsonld/organization';
import { buildWebSite } from '@/lib/seo/jsonld/website';
import { siteUrl, type SiteSettings } from '@/lib/site';
import type { Destination, Media, Page, Stay, Universe, Video } from '@/payload-types';
import { DeltaMap } from './DeltaMap';
import { formatTimestamp } from './FilmView';
import { HOME_SEARCH_ID, HomeSearch } from './HomeSearch';

type HomeViewProps = {
  locale: Locale;
  page: Page | null;
  settings: SiteSettings;
  featured: readonly Stay[];
  universes: readonly Universe[];
  destinations: readonly Destination[];
  /** Film d'immersion (format « film ») et vidéos verticales de 15 s. */
  film: Video | null;
  verticals: readonly Video[];
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

/** Marges et largeur des sections (maquette : 1280 px, gouttière fluide de 20 à 64 px). */
/**
 * `sizes` du héro : pleine largeur. Sur téléphone la photo n'occupe que le haut du héro
 * (34 rem, fondu vers le bas) : moins recadrée, elle reste l'élément LCP sans être demandée
 * plus large que l'écran (budget de l'image principale, débit 4G simulé).
 */
const HOME_HERO_SIZES = '(min-width: 1280px) 1280px, 100vw';

const WRAP = 'mx-auto w-full max-w-7xl px-4 sm:px-8 lg:px-16';
const SECTION_Y = 'py-[clamp(4.5rem,9vw,7.5rem)]';

/** Titre de section en Cormorant, accent en italique. */
const Display = ({
  id,
  start,
  accent,
  end = '',
  accentClass,
  className = '',
}: {
  id?: string;
  start: string;
  accent: string;
  end?: string;
  accentClass: string;
  className?: string;
}) => (
  <h2 id={id} className={`display text-[clamp(2.5rem,4.6vw,4rem)] ${className}`}>
    {start} <em className={accentClass}>{accent}</em>
    {end}
  </h2>
);

const Icon = ({ children }: { children: ReactNode }) => (
  <svg
    aria-hidden="true"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#f0a257"
    strokeWidth="2"
    strokeLinecap="round"
    className="shrink-0"
  >
    {children}
  </svg>
);

const WhyIcon = ({ children }: { children: ReactNode }) => (
  <svg
    aria-hidden="true"
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#9e4521"
    strokeWidth="1.7"
    strokeLinecap="round"
  >
    {children}
  </svg>
);

const PlayGlyph = ({ size }: { size: number }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" className="fill-current">
    <path d="M7 4.5v15l13-7.5z" />
  </svg>
);

// Accueil (T095, FR-001), d'après la maquette « Accueil » : héro crépusculaire et recherche,
// garanties, film d'immersion avec chapitres et vidéos de 15 s, manifeste, séjours signature,
// quatre univers, Ndangane et ses îles, trois étapes, engagement, appel WhatsApp.
export const HomeView = async ({
  locale,
  page,
  settings,
  featured,
  universes,
  destinations,
  film,
  verticals,
  ambientLoopSrc,
}: HomeViewProps) => {
  const t = await getTranslations({ locale, namespace: 'home' });
  const tAmbient = await getTranslations({ locale, namespace: 'ambient' });
  const tFilm = await getTranslations({ locale, namespace: 'film' });
  const tStay = await getTranslations({ locale, namespace: 'stay' });
  const origin = siteUrl();
  const graph = buildGraph([
    buildOrganization(settings, origin),
    buildWebSite(origin, locale, settings.brandName),
  ]);
  const hero = heroImage(page, featured);
  const whatsapp = await whatsappAction(locale, settings, {
    path: buildPath(locale, { type: 'home' }),
  });
  const filmPath = buildPath(locale, { type: 'film' });
  const composePath = checkoutPath(locale, 'compose');
  const staysPath = buildPath(locale, { type: 'staysList' });
  const captions: VideoCaption[] = (film?.captions ?? []).map((caption) => ({
    locale: caption.locale,
    url: caption.url,
    label: caption.locale === 'fr' ? tFilm('captionsFr') : tFilm('captionsEn'),
  }));
  const chapters = (film?.chapters ?? [])
    .filter((chapter) => chapter.title)
    .map((chapter) => ({
      title: chapter.title ?? '',
      startSeconds: chapter.startSeconds,
      href: `${filmPath}?t=${Math.round(chapter.startSeconds)}`,
      time: formatTimestamp(chapter.startSeconds),
    }));
  const universeHref = (universe: Universe): string =>
    universe.kind === 'stay' || !universe.seo?.slug
      ? staysPath
      : buildPath(locale, { type: 'universe', universe: universe.seo.slug });
  const ndangane = destinations.find((destination) => destination.name === 'Ndangane');
  // Camp de base en tête de liste (maquette), puis l'ordre du CMS.
  const orderedDestinations = ndangane
    ? [ndangane, ...destinations.filter((destination) => destination.id !== ndangane.id)]
    : destinations;

  const trust = [
    {
      text: t('trustPayments'),
      icon: (
        <>
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3 10h18" />
        </>
      ),
    },
    { text: t('trustTransfer'), icon: <path d="M3 17h18M5 17l2-6h10l2 6M8 11V8h8v3" /> },
    {
      text: t('trustPartners'),
      icon: (
        <>
          <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" />
          <path d="M9 12l2 2 4-4" />
        </>
      ),
    },
    {
      text: t('trustHost'),
      icon: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-5A8 8 0 1 1 21 12z" />,
    },
  ];

  const why = [
    {
      title: t('why1Title'),
      text: t('why1Text'),
      icon: (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
        </>
      ),
    },
    {
      title: t('why2Title'),
      text: t('why2Text'),
      icon: (
        <>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M4 10h16M9 3v4M15 3v4M8 14h3" />
        </>
      ),
    },
    {
      title: t('why3Title'),
      text: t('why3Text'),
      icon: (
        <>
          <path d="M12 21c-5-3-8-7-8-11a8 8 0 0 1 16 0c0 4-3 8-8 11z" />
          <path d="M12 7v6M9 10h6" />
        </>
      ),
    },
    {
      title: t('why4Title'),
      text: t('why4Text'),
      icon: (
        <>
          <path d="M5 20c0-7 5-12 14-15-1 9-6 14-13 14" />
          <path d="M5 20l7-7" />
        </>
      ),
    },
  ];

  return (
    <>
      <JsonLd graph={graph} />

      {/* ============ HÉRO ============ */}
      <section
        aria-labelledby="accueil-titre"
        className="relative isolate overflow-hidden bg-[#16193a] text-sable"
      >
        <CmsImage
          media={hero}
          locale={locale}
          sizes={HOME_HERO_SIZES}
          priority
          className="absolute inset-x-0 top-0 -z-10 h-[34rem] w-full object-cover sm:inset-y-0 sm:h-full"
        />
        {ambientLoopSrc && (
          <AmbientLoop
            src={ambientLoopSrc}
            pauseLabel={tAmbient('pause')}
            playLabel={tAmbient('play')}
          />
        )}
        {/* Téléphone : fondu du bas de la photo vers la nuit (dégradé peint une fois, pas de masque :
            un mask-image sur la photo coûte cher au premier rendu en densité ×3). */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-[22rem] -z-10 h-48 bg-[linear-gradient(to_bottom,transparent,#16193a)] sm:hidden"
        />
        {/* Voile crépusculaire (nuit → prune → nuit) : texte sable ≥ 5,5:1 sur toute photo. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(20_24_58/0.82)_0%,rgb(74_40_72/0.78)_48%,rgb(11_20_25/0.9)_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute -right-24 bottom-24 -z-10 hidden h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgb(255_217_160/0.55),rgb(240_162_87/0.15)_45%,transparent_70%)] lg:block"
        />
        <div
          className={`${WRAP} flex min-h-[46rem] flex-col justify-between gap-12 pt-32 pb-14 lg:min-h-[51rem] lg:pt-44`}
        >
          <div className="flex max-w-3xl flex-col gap-6">
            <p className="eyebrow tracking-[0.22em] text-gold">{t('eyebrow')}</p>
            <h1
              id="accueil-titre"
              className="display text-[clamp(3.25rem,7.4vw,6.75rem)] leading-[0.98] text-sable"
            >
              {page?.title && page.title !== t('heading') ? (
                page.title
              ) : (
                <>
                  {t('headingStart')} <em className="text-gold">{t('headingAccent')}</em>
                </>
              )}
            </h1>
            <p className="max-w-xl text-[clamp(1.0625rem,1.6vw,1.25rem)] leading-relaxed text-[#ede3d3]">
              {t('lead')}
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <a
                href="#immersion"
                className="inline-flex min-h-13 items-center gap-3.5 font-semibold text-sable"
              >
                <span className="pulse flex h-13 w-13 items-center justify-center rounded-full border-[1.5px] border-sable/60 bg-sable/15">
                  <PlayGlyph size={18} />
                </span>
                {t('watchFilm')}
              </a>
              {/* Téléphone : raccourci vers la recherche, dans la zone du pouce. */}
              <a
                href={`#${HOME_SEARCH_ID}`}
                className="inline-flex min-h-touch w-full items-center justify-center rounded-full bg-ocre px-6 font-semibold text-cream sm:hidden"
              >
                {t('findStay')}
              </a>
            </div>
          </div>
          <HomeSearch locale={locale} />
        </div>
      </section>

      {/* ============ GARANTIES ============ */}
      <section aria-label={t('trustLabel')} className="bg-mangrove text-[#e9e1d2]">
        <ul
          className={`${WRAP} flex flex-col gap-3.5 py-6 text-sm font-medium md:flex-row md:flex-wrap md:justify-between md:gap-x-6`}
        >
          {trust.map((item) => (
            <li key={item.text} className="flex items-center gap-2.5">
              <Icon>{item.icon}</Icon>
              {item.text}
            </li>
          ))}
        </ul>
      </section>

      {/* ============ FILM D'IMMERSION ============ */}
      {film && (
        <section
          id="immersion"
          aria-labelledby="immersion-titre"
          className={`scroll-mt-4 bg-night text-sable`}
        >
          <div className={`${WRAP} ${SECTION_Y} flex flex-col gap-11`}>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="flex max-w-2xl min-w-0 flex-col gap-4">
                <p className="eyebrow text-gold-deep">{t('filmEyebrow')}</p>
                <Display
                  id="immersion-titre"
                  start={t('filmHeadingStart')}
                  accent={t('filmHeadingAccent')}
                  end="."
                  accentClass="text-gold"
                  className="text-[clamp(2.625rem,5vw,4.5rem)] leading-[1.02]"
                />
                <p className="text-lg leading-relaxed text-[#d8cfbf]">{t('filmLead')}</p>
              </div>
              <p className="text-sm text-mist">{t('filmPlace')}</p>
            </div>

            <VideoPlayer
              variant="immersive"
              badge={t('demoBadge')}
              playbackId={film.muxPlaybackId}
              playLabel={tFilm('playLabel', { title: film.title ?? '' })}
              playText={`${tFilm('play')} · ${formatTimestamp(film.durationSeconds)}`}
              format="landscape"
              defaultCaption={locale}
              captions={captions}
              chaptersLabel={tFilm('chapters')}
              chapters={chapters}
              poster={
                <CmsImage
                  media={populated<Media>(film.poster)}
                  locale={locale}
                  sizes="(min-width: 1280px) 760px, (min-width: 1024px) 60vw, calc(100vw - 2rem)"
                  className="drift absolute inset-0 h-full w-full object-cover"
                />
              }
            />

            {verticals.length > 0 && (
              <div className="flex flex-col gap-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h3 className="display text-[2.125rem]">{t('reelsTitle')}</h3>
                  <Link
                    href={filmPath}
                    className="inline-flex min-h-touch items-center font-semibold text-gold"
                  >
                    {t('reelsMore')} <span aria-hidden="true">&nbsp;→</span>
                  </Link>
                </div>
                <ul className="grid grid-cols-2 gap-3 sm:gap-[1.125rem] md:grid-cols-4">
                  {verticals.slice(0, 4).map((video, index) => (
                    <li key={video.id}>
                      <Link
                        href={`${filmPath}#video-${index + 1}`}
                        className="group relative block aspect-[9/16] overflow-hidden rounded-[22px] text-cream transition-transform duration-300 hover:-translate-y-1.5"
                      >
                        <CmsImage
                          media={populated<Media>(video.poster)}
                          locale={locale}
                          sizes="(min-width: 768px) 25vw, 50vw"
                          quality={CARD_QUALITY}
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <span className="absolute inset-0 flex flex-col justify-between bg-[linear-gradient(transparent_45%,rgb(5_10_9/0.85))] p-4">
                          <span className="self-end rounded-full bg-[rgb(5_10_9/0.6)] px-2.5 py-1.5 text-xs font-semibold">
                            {formatTimestamp(video.durationSeconds)}
                          </span>
                          <span className="flex flex-col gap-1">
                            <PlayGlyph size={28} />
                            <strong className="text-[1.0625rem] leading-tight">
                              {video.title}
                            </strong>
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============ MANIFESTE ============ */}
      <section
        aria-labelledby="manifeste-titre"
        className={`${WRAP} flex flex-col gap-12 py-[clamp(4.5rem,9vw,8rem)] lg:flex-row lg:gap-20`}
      >
        <div className="flex flex-col gap-5 lg:flex-[1_1_24rem]">
          <p className="eyebrow text-ocre">{t('manifestoEyebrow')}</p>
          <Display
            id="manifeste-titre"
            start={t('manifestoStart')}
            accent={t('manifestoAccent')}
            accentClass="text-ocre"
          />
          <p className="max-w-[30rem] text-lg leading-[1.7] text-ink-soft">{t('manifestoText')}</p>
        </div>
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:flex-[1_1_32rem]">
          {why.map((item) => (
            <li
              key={item.title}
              className="flex flex-col gap-3 rounded-[20px] border border-warm-line bg-paper p-7"
            >
              <WhyIcon>{item.icon}</WhyIcon>
              <h3 className="font-sans text-[1.1875rem] font-bold">{item.title}</h3>
              <p className="text-[0.9375rem] leading-relaxed text-ink-muted">{item.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <div aria-hidden="true" className="weave" />

      {/* ============ SÉJOURS SIGNATURE ============ */}
      {featured.length > 0 && (
        <section id="sejours" aria-labelledby="sejours-titre" className={`bg-mangrove text-sable`}>
          <div className={`${WRAP} ${SECTION_Y} flex flex-col gap-12`}>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="flex max-w-2xl min-w-0 flex-col gap-4">
                <p className="eyebrow text-gold-deep">{t('featuredEyebrow')}</p>
                <Display
                  id="sejours-titre"
                  start={t('featuredStart')}
                  accent={t('featuredAccent')}
                  accentClass="text-gold"
                />
              </div>
              <Link
                href={composePath}
                className="inline-flex min-h-touch items-center gap-2 rounded-full border border-sable/45 px-5 font-semibold transition-colors hover:bg-sable/15"
              >
                {t('customStay')} <span aria-hidden="true">→</span>
              </Link>
            </div>
            <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((stay) => {
                const slug = stay.seo?.slug;
                if (!slug || !stay.title) return null;
                const href = buildPath(locale, { type: 'stay', slug });
                const highlights = (stay.included ?? [])
                  .map((row) => row.item)
                  .filter((item): item is string => Boolean(item))
                  .slice(0, 4);
                const price = priceFrom(
                  stay.pricing.lowSeasonPerPerson,
                  stay.pricing.highSeasonPerPerson,
                );
                return (
                  <li key={stay.id}>
                    <article className="lift relative flex h-full flex-col overflow-hidden rounded-3xl bg-sable text-ink">
                      <CmsImage
                        media={populated<Media>(stay.heroImage)}
                        locale={locale}
                        sizes={CARD_SIZES}
                        quality={CARD_QUALITY}
                        className="aspect-[400/230] w-full object-cover"
                      />
                      <div className="flex flex-1 flex-col gap-3.5 p-7">
                        <p className="text-xs font-bold tracking-[0.12em] text-ocre uppercase">
                          {tStay('nights', { count: stay.durationNights })}
                          {stay.summary ? ` · ${stay.summary}` : ''}
                        </p>
                        <h3 className="text-[2rem] leading-[1.05]">{stay.title}</h3>
                        {highlights.length > 0 && (
                          <ul className="flex flex-col gap-2 text-[0.9375rem] text-ink-soft">
                            {highlights.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        )}
                        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-warm-line pt-4">
                          <p className="text-sm text-ink-muted">
                            {t('from')}{' '}
                            <strong className="text-xl text-ink">{formatXof(price)}</strong>{' '}
                            {t('perPerson')}
                          </p>
                          <Link
                            href={href}
                            aria-label={t('bookLabel', { title: stay.title })}
                            className="inline-flex min-h-touch items-center font-bold text-ocre after:absolute after:inset-0 hover:text-ocre-deep"
                          >
                            {t('book')} <span aria-hidden="true">&nbsp;→</span>
                          </Link>
                        </div>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* ============ QUATRE UNIVERS ============ */}
      {universes.length > 0 && (
        <section
          id="experiences"
          aria-labelledby="univers-titre"
          className={`${WRAP} flex flex-col gap-12 py-[clamp(4.5rem,9vw,8rem)]`}
        >
          <div className="flex max-w-3xl flex-col gap-4">
            <p className="eyebrow text-ocre">{t('universesEyebrow')}</p>
            <h2 id="univers-titre" className="display text-[clamp(2.5rem,4.6vw,4rem)]">
              {t('universes')}
            </h2>
          </div>
          <ol className="grid grid-cols-1 border-t border-[#d8cbb4] sm:grid-cols-2 lg:grid-cols-4">
            {universes.map((universe, index) => (
              <li
                key={universe.id}
                className="flex flex-col gap-3.5 border-b border-[#d8cbb4] py-9 pr-7"
              >
                <span aria-hidden="true" className="font-serif text-[1.375rem] text-ocre">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="font-sans text-[1.375rem] font-bold">{universe.name}</h3>
                {universe.intro && (
                  <p className="text-[0.9375rem] leading-[1.65] text-ink-muted">{universe.intro}</p>
                )}
                <Link
                  href={universeHref(universe)}
                  aria-label={t('universeLinkLabel', { name: universe.name ?? '' })}
                  className="inline-flex min-h-touch items-center text-[0.9375rem] font-semibold text-ocre underline-offset-4 hover:underline"
                >
                  {t('universeLink')}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ============ ÎLES & VILLAGES ============ */}
      {destinations.length > 0 && (
        <section id="destinations" aria-labelledby="destinations-titre" className={`bg-sand-dark`}>
          <div className={`${WRAP} ${SECTION_Y} flex flex-col gap-14 lg:flex-row lg:gap-20`}>
            <div className="flex flex-col gap-5 lg:flex-[1_1_22rem]">
              <p className="eyebrow text-ocre">{t('destinationsEyebrow')}</p>
              <Display
                id="destinations-titre"
                start={t('destinationsStart')}
                accent={t('destinationsAccent')}
                accentClass="text-ocre"
              />
              <p className="text-[1.0625rem] leading-[1.7] text-ink-soft">
                {t('destinationsText')}
              </p>
              <DeltaMap
                title={t('mapTitle')}
                description={t('mapDescription')}
                baseId={ndangane?.id ?? null}
                points={destinations.map((destination) => ({
                  id: destination.id,
                  name: destination.name ?? '',
                  latitude: destination.geo.latitude,
                  longitude: destination.geo.longitude,
                }))}
              />
            </div>
            <ul className="flex flex-col lg:flex-[1_1_30rem]">
              {orderedDestinations.map((destination) => {
                const slug = destination.seo?.slug;
                return (
                  <li
                    key={destination.id}
                    className="relative flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-[#cdbea4] py-6"
                  >
                    <div className="flex flex-col gap-1.5">
                      <h3 className="text-[1.875rem]">
                        {slug ? (
                          <Link
                            href={buildPath(locale, { type: 'destination', slug })}
                            className="inline-flex min-h-touch items-center after:absolute after:inset-0 hover:text-ocre"
                          >
                            {destination.name}
                          </Link>
                        ) : (
                          destination.name
                        )}
                      </h3>
                      {destination.intro && (
                        <p className="text-[0.9375rem] leading-relaxed text-ink-muted">
                          {destination.intro}
                        </p>
                      )}
                    </div>
                    <span className="text-[0.8125rem] font-semibold whitespace-nowrap text-[#6b4a2e]">
                      {destination.id === ndangane?.id
                        ? t('baseCamp')
                        : t(`kind_${destination.kind}`)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* ============ TROIS GESTES ============ */}
      <section
        aria-labelledby="etapes-titre"
        className={`${WRAP} flex flex-col gap-12 py-[clamp(4.5rem,9vw,8rem)]`}
      >
        <Display
          id="etapes-titre"
          start={t('stepsStart')}
          accent={t('stepsAccent')}
          accentClass="text-ocre"
          className="max-w-3xl"
        />
        <ol className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {(
            [
              [t('step1Title'), t('step1')],
              [t('step2Title'), t('step2')],
              [t('step3Title'), t('step3')],
            ] as const
          ).map(([title, text], index) => (
            <li
              key={title}
              className="flex flex-col gap-3.5 rounded-[22px] border border-warm-line bg-paper p-8"
            >
              <span
                aria-hidden="true"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-mangrove font-serif text-2xl font-semibold text-gold"
              >
                {index + 1}
              </span>
              <h3 className="font-sans text-xl font-bold">{title}</h3>
              <p className="text-[0.9375rem] leading-[1.65] text-ink-muted">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ============ ENGAGEMENT ============ */}
      <section
        id="engagement"
        aria-labelledby="engagement-titre"
        className="bg-mangrove text-sable"
      >
        <div
          className={`${WRAP} ${SECTION_Y} flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-20`}
        >
          <blockquote className="font-serif text-[clamp(2rem,3.6vw,3rem)] leading-[1.18] font-medium text-gold italic lg:flex-[1_1_30rem]">
            {t('commitmentQuote')}
          </blockquote>
          <div className="flex flex-col gap-5 lg:flex-[1_1_24rem]">
            <h2 id="engagement-titre" className="eyebrow font-sans text-gold-deep">
              {t('commitmentEyebrow')}
            </h2>
            <ul className="flex flex-col gap-4.5 text-base leading-relaxed text-[#e1d8c8]">
              {[t('commitment1'), t('commitment2'), t('commitment3'), t('commitment4')].map(
                (item) => (
                  <li key={item} className="flex gap-3.5">
                    <span aria-hidden="true" className="text-gold-deep">
                      ◆
                    </span>
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* ============ APPEL ============ */}
      <section aria-labelledby="contact-titre" className={`${WRAP} ${SECTION_Y}`}>
        <div className="flex flex-col gap-8 rounded-[32px] bg-ocre p-[clamp(2.5rem,6vw,4.5rem)] text-cream lg:flex-row lg:items-center lg:justify-between">
          <div className="flex max-w-2xl flex-col gap-3.5">
            <h2
              id="contact-titre"
              className="display text-[clamp(2.25rem,4vw,3.5rem)] leading-[1.05]"
            >
              {t('ctaTitle')}
            </h2>
            <p className="text-[1.0625rem] leading-relaxed text-[#fbe6d2]">{t('ctaText')}</p>
            {settings.responseTimeText && (
              <p className="text-sm text-[#fbe6d2]">{settings.responseTimeText}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {whatsapp && (
              <a
                href={whatsapp.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={whatsapp.ariaLabel}
                className="inline-flex min-h-13 max-w-full min-w-0 items-center gap-2.5 rounded-full bg-cream px-6 py-2 font-bold text-ocre-deep"
              >
                <svg
                  aria-hidden="true"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-5A8 8 0 1 1 21 12z" />
                </svg>
                {whatsapp.label}
              </a>
            )}
            <Link
              href={composePath}
              className="inline-flex min-h-13 max-w-full min-w-0 items-center rounded-full border-[1.5px] border-cream px-6 py-2 font-bold text-cream"
            >
              {t('ctaCompose')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};
