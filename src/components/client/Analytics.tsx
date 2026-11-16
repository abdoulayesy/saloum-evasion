'use client';

import { useEffect } from 'react';
import { pageType, track } from '@/lib/analytics';

// Plausible (T161) : script chargé en `requestIdleCallback` (repli : `load` + 2 s), seulement si
// un domaine est configuré ; aucun script tiers dans le HTML initial. Un seul écouteur délégué
// suit les clics WhatsApp (`placement` déduit du conteneur) et le sélecteur de langue.

type AnalyticsProps = { domain: string | null; scriptSrc: string };

const placementOf = (element: Element): string => {
  if (element.closest('[data-sticky-action-bar]')) return 'sticky_bar';
  if (element.closest('dialog')) return 'menu';
  if (element.closest('header')) return 'header';
  if (element.closest('footer')) return 'footer';
  if (element.closest('[data-request-confirmation]')) return 'confirmation';
  return 'page';
};

const whenIdle = (callback: () => void): (() => void) => {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(callback, { timeout: 5000 });
    return () => window.cancelIdleCallback(id);
  }
  const onLoad = () => window.setTimeout(callback, 2000);
  if (document.readyState === 'complete') {
    const id = window.setTimeout(callback, 2000);
    return () => window.clearTimeout(id);
  }
  window.addEventListener('load', onLoad, { once: true });
  return () => window.removeEventListener('load', onLoad);
};

export const Analytics = ({ domain, scriptSrc }: AnalyticsProps) => {
  useEffect(() => {
    if (!domain) return undefined;
    return whenIdle(() => {
      if (document.querySelector('script[data-plausible]')) return;
      const script = document.createElement('script');
      script.src = scriptSrc;
      script.defer = true;
      script.dataset.domain = domain;
      script.dataset.plausible = '';
      document.head.appendChild(script);
    });
  }, [domain, scriptSrc]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest('a[href]');
      if (!(link instanceof HTMLAnchorElement)) return;
      const page = pageType(window.location.pathname);
      if (link.hostname === 'wa.me') {
        track('whatsapp_click', { placement: placementOf(link), pageType: page });
      }
    };
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  return null;
};
