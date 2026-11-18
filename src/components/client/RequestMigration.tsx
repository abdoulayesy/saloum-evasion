'use client';

import { useEffect, useState } from 'react';
import { migrateRequestDraft } from '@/lib/cart/actions';
import { clearDraft, readDraft } from '@/lib/request/draft';

// Migration unique de la « demande en cours » 001 vers le panier serveur (002, FR-006, T048) :
// si le navigateur garde une demande avec des éléments, ils sont ajoutés au panier (dates et
// voyageurs de la demande) puis la demande locale est effacée.

export const RequestMigration = ({
  locale,
  migratedLabel,
}: {
  locale: 'fr' | 'en';
  migratedLabel: string;
}) => {
  const [message, setMessage] = useState('');
  useEffect(() => {
    const draft = readDraft();
    if (draft.items.length === 0) return;
    void migrateRequestDraft({
      locale,
      items: draft.items.map(({ kind, slug }) => ({ kind, slug })),
      arrivalDate: draft.arrivalDate,
      departureDate: draft.departureDate,
      adults: draft.adults,
      children: draft.children,
    }).then((count) => {
      clearDraft();
      if (count > 0) {
        setMessage(migratedLabel.replace('{count}', String(count)));
        window.location.reload();
      }
    });
  }, [locale, migratedLabel]);
  return (
    <p role="status" aria-live="polite" className="sr-only">
      {message}
    </p>
  );
};
