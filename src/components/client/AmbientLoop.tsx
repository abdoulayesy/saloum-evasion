'use client';

import { useEffect, useRef, useState } from 'react';

// Boucle d'ambiance (T125, research R4) : rendu MP4 basse définition (≤ 8 s, ≤ 1,5 Mo) posé
// sur l'image du héro, qui reste l'élément LCP. Démarre seulement sur ordinateur
// (`(min-width: 1024px) and (pointer: fine)`), sans mouvement réduit ni économie de données,
// et après l'évènement `load` : rien n'est rendu (donc rien n'est téléchargé) sinon.
// Vidéo décorative masquée aux technologies d'assistance ; bouton pause/lecture visible
// (WCAG 2.2.2). En cas d'erreur de chargement, la boucle disparaît et l'image reste.

type AmbientLoopProps = {
  src: string;
  pauseLabel: string;
  playLabel: string;
};

const DESKTOP_QUERY = '(min-width: 1024px) and (pointer: fine)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const savesData = (): boolean => {
  if (!('connection' in navigator)) return false;
  const connection: unknown = navigator.connection;
  return (
    typeof connection === 'object' &&
    connection !== null &&
    'saveData' in connection &&
    connection.saveData === true
  );
};

export const canPlayAmbientLoop = (): boolean =>
  window.matchMedia(DESKTOP_QUERY).matches &&
  !window.matchMedia(REDUCED_MOTION_QUERY).matches &&
  !savesData();

export const AmbientLoop = ({ src, pauseLabel, playLabel }: AmbientLoopProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!canPlayAmbientLoop()) return undefined;
    const enable = () => setEnabled(true);
    if (document.readyState === 'complete') {
      enable();
      return undefined;
    }
    window.addEventListener('load', enable, { once: true });
    return () => window.removeEventListener('load', enable);
  }, []);

  if (!enabled) return null;

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) {
      video.pause();
      setPlaying(false);
      return;
    }
    void video.play().catch(() => undefined);
    setPlaying(true);
  };

  return (
    <>
      <video
        ref={videoRef}
        src={src}
        aria-hidden="true"
        tabIndex={-1}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onError={() => setEnabled(false)}
        className="absolute inset-0 -z-10 h-full w-full object-cover"
        data-ambient-loop=""
      />
      <button
        type="button"
        onClick={toggle}
        className="absolute right-4 bottom-4 z-10 inline-flex min-h-touch min-w-touch items-center justify-center gap-2 rounded-full bg-sable px-4 font-semibold text-mangrove shadow-lg"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          {playing ? (
            <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
          ) : (
            <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
          )}
        </svg>
        <span>{playing ? pauseLabel : playLabel}</span>
      </button>
    </>
  );
};
