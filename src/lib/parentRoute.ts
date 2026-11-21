import type { Route } from '@/i18n/pathnames';

// Page parente d'une page de contenu (bascule de langue sans traduction, T156 et 004 T035).
// Pur : isolé de localeSwitch.ts pour être testé sans le CMS.

/** Parent d'une page de contenu, pour le repli quand la traduction manque. */
export const parentRoute = (route: Route): Route => {
  switch (route.type) {
    case 'stay':
      return { type: 'staysList' };
    case 'experience':
    case 'universe':
      return { type: 'experiencesHub' };
    case 'destination':
      return { type: 'destinationsList' };
    case 'accommodation':
      return { type: 'accommodationsList' };
    case 'guide':
      return { type: 'guidesHub' };
    case 'author':
      return { type: 'about' };
    default:
      return { type: 'home' };
  }
};
