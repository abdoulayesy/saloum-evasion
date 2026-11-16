'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import { pageType, track } from '@/lib/analytics';
import { addItem, readDraft, tripFromSearch, writeDraft } from '@/lib/request/draft';
import type { RequestItemKind } from '@/lib/request/constants';

// « Ajouter à ma demande » (T147, US2) : sans JavaScript, simple lien vers le formulaire avec
// l'élément dans l'URL. Avec JavaScript : l'élément rejoint la « demande en cours » ; pour une
// expérience ou un hébergement on reste sur la fiche (annonce polie, le bouton devient « Voir
// ma demande ») ; pour un séjour on ouvre le formulaire. Dates et voyageurs de l'URL suivent.

type AddToRequestProps = {
  href: string;
  label: string;
  kind: RequestItemKind;
  slug: string;
  title: string;
  formHref: string;
  addedMessage: string;
  viewLabel: string;
  /** Séjour : ouvrir le formulaire après l'ajout. */
  navigate: boolean;
  className: string;
};

const TRIP_KEYS = ['arrivee', 'depart', 'adultes', 'enfants'];

/** Ajoute à un lien les dates et voyageurs présents dans l'URL courante, et la page d'origine. */
const withTrip = (href: string): string => {
  const url = new URL(href, window.location.origin);
  const current = new URLSearchParams(window.location.search);
  for (const key of TRIP_KEYS) {
    const value = current.get(key);
    if (value) url.searchParams.set(key, value);
  }
  url.searchParams.set('from', window.location.pathname);
  return `${url.pathname}${url.search}`;
};

export const AddToRequest = ({
  href,
  label,
  kind,
  slug,
  title,
  formHref,
  addedMessage,
  viewLabel,
  navigate,
  className,
}: AddToRequestProps) => {
  const [added, setAdded] = useState(false);
  const [announce, setAnnounce] = useState('');

  useEffect(() => {
    setAdded(readDraft().items.some((item) => item.kind === kind && item.slug === slug));
  }, [kind, slug]);

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const draft = readDraft();
    const trip = tripFromSearch(new URLSearchParams(window.location.search));
    writeDraft({
      ...addItem(draft, { kind, slug, title }),
      arrivalDate: trip.arrivalDate ?? draft.arrivalDate,
      departureDate: trip.departureDate ?? draft.departureDate,
      adults: trip.adults ?? draft.adults,
      children: trip.children ?? draft.children,
    });
    track('request_item_added', { kind, pageType: pageType(window.location.pathname) });
    if (navigate) {
      event.currentTarget.href = withTrip(href);
      return;
    }
    event.preventDefault();
    setAdded(true);
    setAnnounce(addedMessage);
  };

  return (
    <>
      {added && !navigate ? (
        <a
          href={formHref}
          onClick={(event) => {
            event.currentTarget.href = withTrip(formHref);
          }}
          className={className}
        >
          {viewLabel}
        </a>
      ) : (
        <a href={href} onClick={onClick} className={className}>
          {label}
        </a>
      )}
      <span role="status" aria-live="polite" className="sr-only">
        {announce}
      </span>
    </>
  );
};
