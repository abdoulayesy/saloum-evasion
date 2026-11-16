'use client';

import { useEffect } from 'react';
import { routeTemplate, track } from '@/lib/analytics';

// Suivi terrain des Core Web Vitals (T162) : bibliothèque web-vitals chargée à la demande après
// le premier rendu, un évènement `web_vital` par métrique avec le modèle de route (sans slug) et
// une tranche de valeur (pas de valeur exacte : suffisante pour les objectifs Plausible).

const bucketOf = (name: string, value: number): string => {
  if (name === 'CLS') return value < 0.1 ? '<0.1' : value < 0.25 ? '0.1-0.25' : '>0.25';
  if (name === 'INP') return value < 200 ? '<200ms' : value < 500 ? '200-500ms' : '>500ms';
  return value < 2500 ? '<2.5s' : value < 4000 ? '2.5-4s' : '>4s';
};

export const WebVitals = () => {
  useEffect(() => {
    let active = true;
    // Chargée au premier moment d'inactivité, hors du chemin critique : les observateurs LCP et
    // CLS de web-vitals relisent l'historique (`buffered`), rien n'est perdu.
    const load = () =>
      void import('web-vitals').then(({ onCLS, onINP, onLCP }) => {
        if (!active) return;
        const route = routeTemplate(window.location.pathname);
        const report = (metric: { name: string; value: number; rating: string }) =>
          track('web_vital', {
            metric: metric.name,
            rating: metric.rating,
            bucket: bucketOf(metric.name, metric.value),
            route,
          });
        onLCP(report);
        onINP(report);
        onCLS(report);
      });
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(load, { timeout: 8000 });
      return () => {
        active = false;
        window.cancelIdleCallback(id);
      };
    }
    const timer = window.setTimeout(load, 3000);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);
  return null;
};
