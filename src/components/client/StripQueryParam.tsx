'use client';

import { useEffect } from 'react';

// Retire un paramètre sensible de l'URL visible après le premier affichage (002, contrat des
// routes : jeton de gestion `?k=`), sans recharger la page.
export const StripQueryParam = ({ name }: { name: string }) => {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(name)) return;
    url.searchParams.delete(name);
    window.history.replaceState(
      window.history.state,
      '',
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [name]);
  return null;
};
