'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

// Cadre de l'en-tête : vert mangrove partout, transparent par-dessus le héro de l'accueil
// (maquette « Accueil »). Décidé d'après l'URL courante, qui suit la navigation côté client ;
// une feuille de style posée par la page d'accueil resterait dans <head> après l'avoir quittée.

type Props = { homePaths: readonly string[]; children: ReactNode };

export const HeaderFrame = ({ homePaths, children }: Props) => {
  const pathname = usePathname();
  // `/fr/` (barre oblique ajoutée par certains hébergeurs) vaut `/fr`.
  const overHero = homePaths.includes(
    pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname,
  );
  return (
    <header
      className={
        overHero
          ? 'site-header absolute inset-x-0 top-0 z-30 bg-transparent text-sable'
          : 'site-header bg-mangrove text-sable'
      }
    >
      {children}
    </header>
  );
};
