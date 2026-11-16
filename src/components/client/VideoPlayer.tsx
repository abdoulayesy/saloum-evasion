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
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [startAt, setStartAt] = useState(0);
  const [started, setStarted] = useState(false);
  const aspect = format === 'portrait' ? 'aspect-[9/16]' : 'aspect-video';

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
    <div>
      <div className={`relative overflow-hidden rounded-card bg-mangrove ${aspect}`}>
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
          </>
        )}
      </div>

      {chapters.length > 0 && (
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
