// Mesure d'audience (T161, contrat analytics-events.md) : Plausible, sans cookie, chargé après
// inactivité. Les évènements envoyés avant le chargement sont mis en file (`plausible.q`).
// Aucune donnée personnelle dans les propriétés. Module client, sans dépendance.

type Props = Record<string, string | number | boolean>;

type PlausibleQueue = ((event: string, options?: { props?: Props }) => void) & {
  q?: unknown[][];
};

declare global {
  // Fusion de déclarations avec le type global Window : seule une interface le permet.
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    plausible?: PlausibleQueue;
  }
}

export type AnalyticsEvent =
  | 'whatsapp_click'
  | 'request_item_added'
  | 'request_form_view'
  | 'request_submitted'
  | 'request_failed'
  | 'video_play'
  | 'video_chapter'
  | 'filter_applied'
  | 'language_switch'
  | 'web_vital'
  // Tunnel 002 (T065) : évènements côté client ; les paiements sont mesurés côté serveur.
  | 'cart_item_added'
  | 'cart_view'
  | 'checkout_details_view'
  | 'checkout_payment_view';

/** File d'attente Plausible (remplacée par le script une fois chargé). */
const queue = (): PlausibleQueue => {
  if (window.plausible) return window.plausible;
  const stub: PlausibleQueue = (...args: unknown[]) => {
    (stub.q = stub.q ?? []).push(args);
  };
  window.plausible = stub;
  return stub;
};

export const track = (event: AnalyticsEvent, props: Props = {}): void => {
  if (typeof window === 'undefined') return;
  try {
    queue()(event, { props });
  } catch {
    // La mesure ne doit jamais casser l'interface.
  }
};

const SECTION_TYPES: Record<string, string> = {
  sejours: 'stay',
  stays: 'stay',
  experiences: 'experience',
  hebergements: 'accommodation',
  accommodation: 'accommodation',
  destinations: 'destination',
  demande: 'request',
  request: 'request',
};

/** Modèle de route sans identifiant : `/fr/sejours/x` → `/[locale]/sejours/[slug]`. */
export const routeTemplate = (pathname: string): string => {
  const [, , section, second, third] = pathname.split('/');
  if (!section) return '/[locale]';
  if (section === 'experiences') {
    if (third) return '/[locale]/experiences/[universe]/[slug]';
    if (second) return '/[locale]/experiences/[universe]';
    return '/[locale]/experiences';
  }
  if (second && SECTION_TYPES[section] && section !== 'demande' && section !== 'request')
    return `/[locale]/${section}/[slug]`;
  return `/[locale]/${section}${second ? `/${second}` : ''}`;
};

/** Type de page pour les propriétés d'évènement (`home`, `stay`, `stays_list`…). */
export const pageType = (pathname: string): string => {
  const [, , section, second, third] = pathname.split('/');
  if (!section) return 'home';
  const type = SECTION_TYPES[section];
  if (!type) return section;
  if (type === 'request') return second ? 'request_thanks' : 'request';
  if (type === 'experience') return third ? 'experience' : second ? 'universe' : 'experiences_hub';
  return second ? type : `${type}s_list`;
};

/** Tranche de durée d'une demande (`<60s`, `60-120s`, `>120s`). */
export const durationBucket = (milliseconds: number): string =>
  milliseconds < 60_000 ? '<60s' : milliseconds <= 120_000 ? '60-120s' : '>120s';
