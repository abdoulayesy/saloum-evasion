import { preload } from 'react-dom';

// Constitution II : 2 familles maximum, auto-hébergées, sous-ensemble latin seulement,
// font-display: swap. Les @font-face sont déclarées dans globals.css (une seule feuille CSS
// bloquante au lieu de deux) ; les fichiers woff2 latins sont servis depuis /fonts avec un
// cache immuable (noms versionnés, licence OFL). Les métriques de repli (size-adjust…)
// évitent tout décalage de mise en page pendant le chargement. Seule la police du texte est
// préchargée : avec de vraies photos, l'élément LCP est l'image principale, et précharger aussi
// la police des titres lui disputait la bande passante (mesuré en phase 7).

export const FONT_FILES = [
  '/fonts/cormorant-garamond-600-latin-v1.woff2',
  '/fonts/manrope-variable-latin-v1.woff2',
] as const;

/** Police du texte courant, seule préchargée. */
export const PRELOADED_FONT = '/fonts/manrope-variable-latin-v1.woff2';

/** Précharge la police du texte (à appeler depuis le layout, composant serveur). */
export const preloadFonts = (): void => {
  preload(PRELOADED_FONT, { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });
};
