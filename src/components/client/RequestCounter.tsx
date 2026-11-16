'use client';

import { useEffect, useState } from 'react';
import { DRAFT_EVENT, DRAFT_KEY, readDraft } from '@/lib/request/draft';

// Compteur de la « demande en cours » dans l'en-tête (T147) : emplacement de 44 px réservé
// dès le rendu serveur (aucun décalage de mise en page), lien vers le formulaire dès qu'un
// élément est ajouté ; mis à jour à chaque ajout (même onglet) et entre onglets.

type RequestCounterProps = {
  href: string;
  label: string;
  /** « Ma demande : {count} élément(s) » au singulier et au pluriel. */
  countLabelOne: string;
  countLabelOther: string;
};

export const RequestCounter = ({
  href,
  label,
  countLabelOne,
  countLabelOther,
}: RequestCounterProps) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => setCount(readDraft().items.length);
    const onStorage = (event: StorageEvent) => {
      if (event.key === DRAFT_KEY) update();
    };
    update();
    window.addEventListener(DRAFT_EVENT, update);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(DRAFT_EVENT, update);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return (
    <span className="inline-flex min-h-touch min-w-touch items-center justify-center">
      {count > 0 && (
        <a
          href={href}
          aria-label={(count === 1 ? countLabelOne : countLabelOther).replace(
            '{count}',
            String(count),
          )}
          className="relative inline-flex min-h-touch min-w-touch items-center justify-center rounded-control text-mangrove"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-6 w-6 fill-none stroke-current"
            strokeWidth="2"
          >
            <path d="M6 7h12l-1 13H7L6 7Zm3 0a3 3 0 0 1 6 0" strokeLinejoin="round" />
          </svg>
          <span className="sr-only">{label}</span>
          <span
            aria-hidden="true"
            className="absolute top-1 right-0 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ocre px-1 text-xs font-semibold text-white"
          >
            {count}
          </span>
        </a>
      )}
    </span>
  );
};
