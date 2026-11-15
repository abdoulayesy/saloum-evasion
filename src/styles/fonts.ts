import { preload } from 'react-dom';

// Constitution II : 2 familles maximum, auto-hébergées, sous-ensemble latin seulement,
// font-display: swap. Les @font-face sont déclarées dans globals.css (une seule feuille CSS
// bloquante au lieu de deux) ; les fichiers woff2 latins sont servis depuis /fonts avec un
// cache immuable (noms versionnés, licence OFL). Les métriques de repli (size-adjust…)
// évitent tout décalage de mise en page pendant le chargement. Préchargement conservé :
// mesuré, il avance le LCP (moins de rendus successifs).

export const FONT_FILES = [
  '/fonts/cormorant-garamond-600-latin-v1.woff2',
  '/fonts/manrope-variable-latin-v1.woff2',
] as const;

/** Précharge les deux polices (à appeler depuis le layout, composant serveur). */
export const preloadFonts = (): void => {
  for (const href of FONT_FILES) {
    preload(href, { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });
  }
};
