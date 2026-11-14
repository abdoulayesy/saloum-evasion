import type { Route, RouteType } from '@/i18n/pathnames';

// Routes publiques effectivement livrées. Le menu, le pied de page et le sitemap ne lient que
// celles-ci, pour qu'aucun lien interne ne mène à une 404 pendant la construction du site
// (contrôle des liens cassés en CI). Chaque phase ajoute ses routes ici.
const liveRouteTypes: ReadonlySet<RouteType> = new Set<RouteType>(['home']);

export const isLive = (type: RouteType): boolean => liveRouteTypes.has(type);

type NavRoute = Extract<
  Route,
  {
    type:
      | 'staysList'
      | 'experiencesHub'
      | 'accommodationsList'
      | 'destinationsList'
      | 'film'
      | 'commitment'
      | 'about'
      | 'faq'
      | 'contact';
  }
>;

const mainNavigation: readonly NavRoute[] = [
  { type: 'staysList' },
  { type: 'experiencesHub' },
  { type: 'accommodationsList' },
  { type: 'destinationsList' },
  { type: 'film' },
  { type: 'commitment' },
  { type: 'about' },
  { type: 'faq' },
  { type: 'contact' },
];

type LegalRoute = Extract<Route, { type: 'legal' | 'privacy' }>;

const legalNavigation: readonly LegalRoute[] = [{ type: 'legal' }, { type: 'privacy' }];

export const liveMainNavigation = (): NavRoute[] =>
  mainNavigation.filter((route) => isLive(route.type));

export const liveLegalNavigation = (): LegalRoute[] =>
  legalNavigation.filter((route) => isLive(route.type));
