'use client';

import { useEffect, useState } from 'react';

// Interrogation du statut de paiement (002, T057, < 2 Ko) : toutes les 3 s, arrêt après 10 min ;
// succès → page de confirmation ; échec ou expiration → rechargement (la page serveur affiche la
// cause). Sans JavaScript, le bouton « Actualiser » de la page suffit.

type Props = {
  paymentId: number;
  locale: 'fr' | 'en';
  /** Jeton de gestion transmis à l'API de statut (paiement du solde sans cookie du panier). */
  manageToken?: string | null;
  pendingLabel: string;
};

const INTERVAL_MS = 3000;
const MAX_DURATION_MS = 10 * 60 * 1000;

export const PaymentStatusPoller = ({ paymentId, locale, manageToken, pendingLabel }: Props) => {
  const [message, setMessage] = useState('');
  useEffect(() => {
    const started = Date.now();
    let stopped = false;
    const tokenParam = manageToken ? `&k=${encodeURIComponent(manageToken)}` : '';
    const poll = async () => {
      if (stopped || Date.now() - started > MAX_DURATION_MS) return;
      try {
        const response = await fetch(
          `/api/payments/status/${paymentId}?locale=${locale}${tokenParam}`,
          { cache: 'no-store' },
        );
        if (response.ok) {
          const body: unknown = await response.json();
          if (typeof body === 'object' && body !== null && 'status' in body) {
            if (
              body.status === 'succeeded' &&
              'bookingUrl' in body &&
              typeof body.bookingUrl === 'string'
            ) {
              window.location.assign(body.bookingUrl);
              return;
            }
            if (
              body.status === 'failed' ||
              body.status === 'expired' ||
              body.status === 'abandoned'
            ) {
              window.location.reload();
              return;
            }
          }
        }
      } catch {
        // Réseau coupé : on réessaie au prochain tour.
      }
      setMessage(pendingLabel);
      window.setTimeout(() => void poll(), INTERVAL_MS);
    };
    const timer = window.setTimeout(() => void poll(), INTERVAL_MS);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [paymentId, locale, manageToken, pendingLabel]);
  return (
    <p role="status" aria-live="polite" className="sr-only">
      {message}
    </p>
  );
};
