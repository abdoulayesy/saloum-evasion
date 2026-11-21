'use client';

import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { pageType, track } from '@/lib/analytics';
import { hlsUrl } from '@/lib/mux';

// Lecteur vidéo (T124, research R4) : avant le clic, seulement l'affiche rendue par le serveur
// et un bouton lecture de 44 px au moins ; aucun élément <video>, donc aucun octet vidéo (ni
// manifeste, ni préchargement). Au clic : HLS natif (Safari) ou version allégée de hls.js
// chargée à la demande, sous-titres FR/EN (langue de la page par défaut), commandes natives
// au clavier. Les chapitres sont des liens `?t=` : sans JavaScript ils rechargent la page,
// avec JavaScript ils positionnent le lecteur. `?t=` est aussi lu au premier clic sur lecture.

export type VideoCaption = { locale: 'fr' | 'en'; url: string; label: string };

export type VideoChapterLink = {
  title: string;
  startSeconds: number;
  /** URL `?t=` identique à celle du JSON-LD (Clip.url). */
  href: string;
  /** Horodatage affiché : « 1:14 ». */
  time: string;
};

type VideoPlayerProps = {
  playbackId: string;
  /** Nom accessible du bouton : « Lire le film : {titre} ». */
  playLabel: string;
  /** Texte visible du bouton. */
  playText: string;
  poster: ReactNode;
  captions: readonly VideoCaption[];
  defaultCaption: 'fr' | 'en';
  format: 'landscape' | 'portrait';
  chapters?: readonly VideoChapterLink[];
  chaptersLabel?: string;
  /** « immersive » (accueil) : fond nuit, bouton doré, chapitres à côté du film dès 1024 px. */
  variant?: 'default' | 'immersive';
  /** Badge en surimpression (ex. « Démonstration »). */
  badge?: string;
};

type HlsInstance = { destroy: () => void };

const startFromQuery = (): number => {
  const value = Number(new URLSearchParams(window.location.search).get('t'));
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
};

const PlayIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-current">
    <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
  </svg>
);

export const VideoPlayer = ({
  playbackId,
  playLabel,
  playText,
  poster,
  captions,
  defaultCaption,
  format,
  chapters = [],
  chaptersLabel,
  variant = 'default',
  badge,
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [startAt, setStartAt] = useState(0);
  const [started, setStarted] = useState(false);
  const aspect = format === 'portrait' ? 'aspect-[9/16]' : 'aspect-video';
  const immersive = variant === 'immersive';

  // Source attachée seulement après le clic (le <video> n'existe pas avant).
  useEffect(() => {
    const video = videoRef.current;
    if (!started || !video) return;
    const source = hlsUrl(playbackId);
    let hls: HlsInstance | null = null;
    let cancelled = false;
    const play = () => {
      void video.play().catch(() => {
        // Lecture refusée (politique du navigateur) : les commandes restent disponibles.
      });
    };
    // HLS natif (Safari, Chrome récent) : avec preload="none", rien ne se charge avant play() ;
    // on lance donc la lecture tout de suite et on se positionne dès les métadonnées reçues.
    const playNatively = () => {
      if (startAt > 0) {
        video.addEventListener(
          'loadedmetadata',
          () => {
            video.currentTime = startAt;
          },
          { once: true },
        );
      }
      video.src = source;
      play();
    };
    video.focus();
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      playNatively();
      return undefined;
    }
    void import('hls.js/dist/hls.light.mjs').then(({ default: Hls }) => {
      if (cancelled) return;
      if (!Hls.isSupported()) {
        playNatively();
        return;
      }
      const instance = new Hls({ startPosition: startAt > 0 ? startAt : -1 });
      hls = instance;
      instance.on(Hls.Events.MANIFEST_PARSED, play);
      instance.loadSource(source);
      instance.attachMedia(video);
    });
    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [started, playbackId, startAt]);

  const start = useCallback(
    (at: number) => {
      track('video_play', {
        video: format === 'portrait' ? 'vertical' : 'film',
        pageType: pageType(window.location.pathname),
      });
      setStartAt(at);
      setStarted(true);
    },
    [format],
  );

  const onChapter = (event: MouseEvent<HTMLAnchorElement>, chapter: VideoChapterLink) => {
    event.preventDefault();
    track('video_chapter', { chapter: chapters.indexOf(chapter) });
    window.history.replaceState(null, '', chapter.href);
    const video = videoRef.current;
    if (!started || !video) {
      start(chapter.startSeconds);
      return;
    }
    video.currentTime = chapter.startSeconds;
    void video.play().catch(() => undefined);
    video.focus();
  };

  return (
    <div className={immersive ? 'flex flex-col gap-6 lg:flex-row lg:items-stretch' : undefined}>
      <div
        className={
          immersive
            ? `relative min-w-0 overflow-hidden rounded-[26px] bg-night shadow-[0_40px_80px_-40px_rgb(0_0_0/0.8)] lg:flex-[2] ${aspect}`
            : `relative overflow-hidden rounded-card bg-mangrove ${aspect}`
        }
      >
        {started ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption -- pistes <track> générées depuis `captions` (FR et EN obligatoires dans le CMS pour le film et les verticales)
          <video
            ref={videoRef}
            controls
            playsInline
            preload="none"
            crossOrigin="anonymous"
            data-start-at={startAt}
            className="h-full w-full bg-black"
          >
            {captions.map((caption) => (
              <track
                key={caption.locale}
                kind="subtitles"
                srcLang={caption.locale}
                label={caption.label}
                src={caption.url}
                default={caption.locale === defaultCaption}
              />
            ))}
          </video>
        ) : (
          <>
            {poster}
            {badge && (
              <span className="absolute top-4 left-4 z-10 rounded-full bg-night/75 px-3 py-2 text-xs font-semibold tracking-wide text-sable">
                {badge}
              </span>
            )}
            {immersive ? (
              <button
                type="button"
                onClick={() => start(startFromQuery())}
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-night/30 text-sable"
              >
                <span className="pulse flex h-20 w-20 items-center justify-center rounded-full bg-gold text-mangrove transition-transform hover:scale-105 sm:h-24 sm:w-24">
                  <PlayIcon />
                </span>
                {/* Nom accessible = texte visible + titre du film (WCAG 2.5.3). */}
                <span className="text-base font-semibold [text-shadow:0_2px_12px_rgb(0_0_0/0.6)]">
                  {playText}
                  <span className="sr-only"> — {playLabel}</span>
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => start(startFromQuery())}
                aria-label={playLabel}
                className="absolute inset-0 flex items-center justify-center bg-mangrove/30 text-mangrove"
              >
                <span className="inline-flex min-h-touch items-center gap-2 rounded-full bg-sable px-5 py-3 text-lg font-semibold shadow-lg">
                  <PlayIcon />
                  {playText}
                </span>
              </button>
            )}
          </>
        )}
      </div>

      {immersive && chapters.length > 0 && (
        <nav
          aria-label={chaptersLabel}
          className="flex min-w-0 flex-col gap-1 rounded-[26px] bg-night-soft p-5 lg:flex-1"
        >
          <p className="eyebrow mx-2 mb-2 text-gold-deep">{chaptersLabel}</p>
          <ol className="flex flex-col gap-1">
            {chapters.map((chapter, index) => (
              <li key={chapter.startSeconds}>
                <a
                  href={chapter.href}
                  onClick={(event) => onChapter(event, chapter)}
                  className="flex min-h-[3.75rem] items-center gap-4 rounded-2xl px-3 py-3 text-sable transition-colors hover:bg-sable/10"
                >
                  <span className="w-7 font-serif text-[1.375rem] text-gold">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1 font-semibold">{chapter.title}</span>
                  <span className="text-sm text-mist tabular-nums">{chapter.time}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {!immersive && chapters.length > 0 && (
        <nav aria-label={chaptersLabel} className="mt-4">
          <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {chapters.map((chapter) => (
              <li key={chapter.startSeconds}>
                <a
                  href={chapter.href}
                  onClick={(event) => onChapter(event, chapter)}
                  className="flex min-h-touch items-center gap-3 rounded-control bg-white px-4 py-2 underline-offset-4 hover:underline"
                >
                  <span className="font-semibold text-ocre tabular-nums">{chapter.time}</span>
                  <span>{chapter.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}
    </div>
  );
};
