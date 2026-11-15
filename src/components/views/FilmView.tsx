import { RichText } from '@payloadcms/richtext-lexical/react';
import { getTranslations } from 'next-intl/server';
import { Blocks } from '@/components/blocks/Blocks';
import { VideoPlayer, type VideoCaption } from '@/components/client/VideoPlayer';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CmsImage } from '@/components/ui/CmsImage';
import { Container } from '@/components/ui/Container';
import { ActionBarSpacer, StickyActionBar } from '@/components/ui/StickyActionBar';
import { buildPath } from '@/i18n/pathnames';
import type { Locale } from '@/i18n/routing';
import { populated } from '@/lib/cms/populated';
import { whatsappAction } from '@/lib/pageActions';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildBreadcrumbList } from '@/lib/seo/jsonld/breadcrumb';
import { buildGraph } from '@/lib/seo/jsonld/graph';
import { buildOrganization } from '@/lib/seo/jsonld/organization';
import { buildVideo } from '@/lib/seo/jsonld/video';
import { absoluteUrl, siteUrl, type SiteSettings } from '@/lib/site';
import type { Media, Page, SiteSetting, Video } from '@/payload-types';

type FilmViewProps = {
  locale: Locale;
  page: Page | null;
  settings: SiteSettings;
  settingsGlobal: SiteSetting;
  film: Video | null;
  verticals: readonly Video[];
};

/** 74 → « 1:14 ». */
export const formatTimestamp = (totalSeconds: number): string => {
  const seconds = Math.max(0, Math.round(totalSeconds));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

// Page film (T126, FR-008) : H1, lecteur principal (élément principal et visible : condition
// d'indexation vidéo), chapitres en liens `?t=`, vidéos verticales 9:16, transcription
// descriptive (WCAG 1.2.3). Piste d'audiodescription : en attente de la décision D4.
export const FilmView = async ({
  locale,
  page,
  settings,
  settingsGlobal,
  film,
  verticals,
}: FilmViewProps) => {
  const t = await getTranslations({ locale, namespace: 'film' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const tActions = await getTranslations({ locale, namespace: 'actions' });
  const tBlocks = await getTranslations({ locale, namespace: 'blocks' });
  const title = page?.title ?? '';
  const path = buildPath(locale, { type: 'film' });
  const url = absoluteUrl(path);
  const origin = siteUrl();
  const crumbs = buildBreadcrumbs({ locale, route: { type: 'film' } });
  const whatsapp = await whatsappAction(locale, settings, { title, path });

  const captionsOf = (video: Video): VideoCaption[] =>
    (video.captions ?? []).map((caption) => ({
      locale: caption.locale,
      url: caption.url,
      label: caption.locale === 'fr' ? t('captionsFr') : t('captionsEn'),
    }));
  const chaptersOf = (video: Video) =>
    (video.chapters ?? [])
      .filter((chapter) => chapter.title)
      .map((chapter) => ({ title: chapter.title ?? '', startSeconds: chapter.startSeconds }));

  const filmChapters = film ? chaptersOf(film) : [];
  const graph = buildGraph([
    buildOrganization(settings, origin),
    buildBreadcrumbList(crumbs, url, origin),
    ...(film
      ? [
          buildVideo({
            pageUrl: url,
            fragment: 'film',
            origin,
            locale,
            name: film.title ?? title,
            description: film.description ?? '',
            playbackId: film.muxPlaybackId,
            durationSeconds: film.durationSeconds,
            uploadDate: film.uploadDate,
            chapters: filmChapters,
          }),
        ]
      : []),
    ...verticals.map((video, index) =>
      buildVideo({
        pageUrl: url,
        fragment: `video-${index + 1}`,
        origin,
        locale,
        name: video.title ?? '',
        description: video.description ?? '',
        playbackId: video.muxPlaybackId,
        durationSeconds: video.durationSeconds,
        uploadDate: video.uploadDate,
      }),
    ),
  ]);

  return (
    <article>
      <JsonLd graph={graph} />
      <Breadcrumbs crumbs={crumbs} label={tCommon('breadcrumbLabel')} />
      <Container className="pt-4">
        <h1 className="text-mangrove">{title}</h1>
        {film ? (
          <div className="mt-6">
            <VideoPlayer
              playbackId={film.muxPlaybackId}
              playLabel={t('playLabel', { title: film.title ?? title })}
              playText={t('play')}
              format="landscape"
              defaultCaption={locale}
              captions={captionsOf(film)}
              chaptersLabel={t('chapters')}
              chapters={filmChapters.map((chapter) => ({
                ...chapter,
                href: `${path}?t=${Math.round(chapter.startSeconds)}`,
                time: formatTimestamp(chapter.startSeconds),
              }))}
              poster={
                <CmsImage
                  media={populated<Media>(film.poster)}
                  locale={locale}
                  sizes="(min-width: 1152px) 1088px, calc(100vw - 2rem)"
                  priority
                  className="absolute inset-0 h-full w-full object-cover"
                />
              }
            />
            <p className="mt-3 text-ink-muted">
              {t('duration', {
                minutes: Math.floor(film.durationSeconds / 60),
                seconds: film.durationSeconds % 60,
              })}
            </p>
          </div>
        ) : (
          <p className="mt-4 text-lg">{t('noVideo')}</p>
        )}
      </Container>

      <Blocks
        blocks={page?.blocks ?? []}
        context={{ locale, settings, settingsGlobal, whatsappHref: whatsapp?.href ?? null }}
      />

      {verticals.length > 0 && (
        <Container className="py-6">
          <section aria-labelledby="film-verticales">
            <h2 id="film-verticales" className="text-mangrove">
              {t('verticals')}
            </h2>
            <ul className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              {verticals.map((video) => (
                <li key={video.id} className="min-w-0">
                  <VideoPlayer
                    playbackId={video.muxPlaybackId}
                    playLabel={t('playVideoLabel', { title: video.title ?? '' })}
                    playText={t('playVideo')}
                    format="portrait"
                    defaultCaption={locale}
                    captions={captionsOf(video)}
                    poster={
                      <CmsImage
                        media={populated<Media>(video.poster)}
                        locale={locale}
                        sizes="(min-width: 768px) 25vw, 50vw"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    }
                  />
                  <p className="mt-2 font-semibold">{video.title}</p>
                </li>
              ))}
            </ul>
          </section>
        </Container>
      )}

      {film?.descriptiveTranscript && (
        <Container className="py-6">
          <section aria-labelledby="film-transcription">
            <h2 id="film-transcription" className="text-mangrove">
              {t('transcript')}
            </h2>
            <div className="rich-text mt-4 max-w-prose">
              <RichText data={film.descriptiveTranscript} />
            </div>
          </section>
        </Container>
      )}

      <StickyActionBar
        primary={{ href: buildPath(locale, { type: 'staysList' }), label: tBlocks('ctaStays') }}
        whatsapp={whatsapp}
        label={tActions('barLabel')}
      />
      <ActionBarSpacer />
    </article>
  );
};
