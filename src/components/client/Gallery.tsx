'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

// Galerie (T077, FR-018) : défilement natif `scroll-snap` au doigt (fonctionne sans JS),
// boutons précédent / suivant de 44 px (WCAG 2.5.1 : alternative au geste), flèches du
// clavier, position annoncée poliment. Les images (rendues par le serveur) sont passées en
// enfants ; marges latérales de 16 px pour ne pas gêner le geste retour du téléphone.

type GalleryProps = {
  label: string;
  previousLabel: string;
  nextLabel: string;
  /** Modèle « Photo {current} sur {total} ». */
  positionTemplate: string;
  slides: ReactNode[];
};

export const Gallery = ({
  label,
  previousLabel,
  nextLabel,
  positionTemplate,
  slides,
}: GalleryProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const total = slides.length;

  const goTo = useCallback(
    (index: number) => {
      const track = trackRef.current;
      const next = Math.max(0, Math.min(total - 1, index));
      const slide = track?.querySelector('ul')?.children.item(next);
      if (!track || !(slide instanceof HTMLElement)) return;
      track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: 'smooth' });
      setCurrent(next);
    },
    [total],
  );

  // Diapositive courante : la dernière si on est au bout, sinon la plus proche du bord gauche.
  const onScroll = () => {
    const track = trackRef.current;
    const slides = track?.querySelector('ul')?.children;
    if (!track || !slides || slides.length === 0) return;
    if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 2) {
      setCurrent(slides.length - 1);
      return;
    }
    let nearest = 0;
    let best = Infinity;
    Array.from(slides).forEach((slide, index) => {
      if (!(slide instanceof HTMLElement)) return;
      const distance = Math.abs(slide.offsetLeft - track.offsetLeft - track.scrollLeft);
      if (distance < best) {
        best = distance;
        nearest = index;
      }
    });
    setCurrent(nearest);
  };

  // Flèches du clavier sur la zone focalisable (écouteur natif : la zone n'est pas un bouton).
  useEffect(() => {
    const region = trackRef.current;
    if (!region) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        goTo(current + (event.key === 'ArrowRight' ? 1 : -1));
      }
    };
    region.addEventListener('keydown', onKeyDown);
    return () => region.removeEventListener('keydown', onKeyDown);
  }, [current, goTo]);

  if (total === 0) return null;
  const position = positionTemplate
    .replace('{current}', String(current + 1))
    .replace('{total}', String(total));

  return (
    <div>
      {/* Zone défilante focalisable (WCAG 2.1.1) : défilement au doigt, flèches au clavier. */}
      <div
        ref={trackRef}
        onScroll={onScroll}
        role="region"
        aria-roledescription="carrousel"
        aria-label={label}
        tabIndex={0}
        className="snap-x snap-mandatory [scrollbar-width:thin] overflow-x-auto px-4 pb-2 sm:px-8"
      >
        <ul className="flex gap-3">
          {slides.map((slide, index) => (
            <li
              key={index}
              aria-label={positionTemplate
                .replace('{current}', String(index + 1))
                .replace('{total}', String(total))}
              className="w-[85%] shrink-0 snap-center sm:w-[60%] lg:w-[45%]"
            >
              {slide}
            </li>
          ))}
        </ul>
      </div>
      {total > 1 && (
        <div className="mt-3 flex items-center justify-between gap-3 px-4 sm:px-8">
          <button
            type="button"
            onClick={() => goTo(current - 1)}
            disabled={current === 0}
            aria-label={previousLabel}
            className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-control border-2 border-mangrove text-mangrove disabled:opacity-40"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <p
            aria-live="polite"
            className="min-w-0 flex-1 text-center text-sm text-ink-muted tabular-nums"
          >
            {position}
          </p>
          <button
            type="button"
            onClick={() => goTo(current + 1)}
            disabled={current === total - 1}
            aria-label={nextLabel}
            className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-control border-2 border-mangrove text-mangrove disabled:opacity-40"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};
