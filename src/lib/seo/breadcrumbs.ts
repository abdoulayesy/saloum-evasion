import { buildPath, type Route } from '@/i18n/pathnames';
import type { Locale } from '@/i18n/routing';
import en from '@/i18n/messages/en.json';
import fr from '@/i18n/messages/fr.json';

// Fil d'Ariane calculé depuis le type de route : source unique pour l'affichage
// (components/ui/Breadcrumbs) et pour le JSON-LD BreadcrumbList (contrat jsonld.md).
// Absent sur l'accueil, la demande et sa confirmation (spec FR-025).

export type Crumb = { name: string; path?: string };

export type BreadcrumbInput = {
  locale: Locale;
  route: Route;
  /** Titre du document courant (fiches, univers, destinations). */
  currentName?: string;
  /** Nom de l'univers parent d'une fiche expérience. */
  universeName?: string;
};

const messages = { fr, en };

type ListRoute = Extract<
  Route,
  {
    type: 'staysList' | 'experiencesHub' | 'accommodationsList' | 'destinationsList' | 'guidesHub';
  }
>;

export const buildBreadcrumbs = ({
  locale,
  route,
  currentName,
  universeName,
}: BreadcrumbInput): Crumb[] => {
  const labels = messages[locale];
  const home: Crumb = { name: labels.common.home, path: buildPath(locale, { type: 'home' }) };
  const list = (listRoute: ListRoute): Crumb => ({
    name: labels.routes[listRoute.type],
    path: buildPath(locale, listRoute),
  });
  const current = (fallback: string): Crumb => ({ name: currentName ?? fallback });

  switch (route.type) {
    case 'home':
    case 'request':
    case 'requestThanks':
      return [];
    case 'staysList':
    case 'experiencesHub':
    case 'accommodationsList':
    case 'destinationsList':
    case 'film':
    case 'commitment':
    case 'about':
    case 'faq':
    case 'contact':
    case 'legal':
    case 'privacy':
    case 'guidesHub':
      return [home, { name: labels.routes[route.type] }];
    case 'guide':
      return [home, list({ type: 'guidesHub' }), current(route.slug)];
    case 'author':
      // Contrat jsonld 004 : Accueil › À propos › auteur.
      return [
        home,
        { name: labels.routes.about, path: buildPath(locale, { type: 'about' }) },
        current(route.slug),
      ];
    case 'stay':
      return [home, list({ type: 'staysList' }), current(route.slug)];
    case 'universe':
      return [home, list({ type: 'experiencesHub' }), current(route.universe)];
    case 'experience':
      return [
        home,
        list({ type: 'experiencesHub' }),
        {
          name: universeName ?? route.universe,
          path: buildPath(locale, { type: 'universe', universe: route.universe }),
        },
        current(route.slug),
      ];
    case 'accommodation':
      return [home, list({ type: 'accommodationsList' }), current(route.slug)];
    case 'destination':
      return [home, list({ type: 'destinationsList' }), current(route.slug)];
    default: {
      const unreachable: never = route;
      return unreachable;
    }
  }
};
