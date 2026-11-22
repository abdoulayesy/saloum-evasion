import { isLocale, type Locale } from '@/i18n/routing';

// Chemins du tunnel de commande (002, T003 ; contrat routes-tunnel.md ; plan, tension T19).
// URL publiques traduites (`/fr/panier`, `/en/cart`…) réécrites par le middleware vers des
// routes internes `/{langue}/tunnel/...` (groupe `(checkout)`), dynamiques et isolées du
// résolveur des pages publiques, qui restent statiques. Module pur.

export const INTERNAL_TUNNEL_SEGMENT = 'tunnel';

export type CheckoutStep =
  | 'compose'
  | 'cart'
  | 'resume'
  | 'unsubscribe'
  | 'details'
  | 'payment'
  | 'status'
  | 'find'
  | 'booking'
  | 'balance'
  | 'cancel';

export type CheckoutRoute = { step: CheckoutStep; ref?: string };

const SEGMENTS: Record<Locale, Record<string, string>> = {
  fr: {
    compose: 'composer',
    cart: 'panier',
    resume: 'reprendre',
    unsubscribe: 'desinscription',
    checkout: 'commande',
    details: 'coordonnees',
    payment: 'paiement',
    status: 'statut',
    booking: 'reservation',
    find: 'retrouver',
    balance: 'solde',
    cancel: 'annulation',
  },
  en: {
    compose: 'compose',
    cart: 'cart',
    resume: 'resume',
    unsubscribe: 'unsubscribe',
    checkout: 'checkout',
    details: 'details',
    payment: 'payment',
    status: 'status',
    booking: 'booking',
    find: 'find',
    balance: 'balance',
    cancel: 'cancel',
  },
};

/** Référence de réservation `SE-XXXXXX` (alphabet sans 0, O, 1, I). */
export const BOOKING_REFERENCE_PATTERN = /^SE-[A-HJ-NP-Z2-9]{6}$/;

// Les URL sont en minuscules (le middleware redirige toute majuscule) : la référence y est écrite
// en minuscules et remise en majuscules à l'analyse.
const refInUrl = (ref: string | undefined): string => (ref ?? '').toLowerCase();
const refFromUrl = (value: string): string | null => {
  const ref = value.toUpperCase();
  return BOOKING_REFERENCE_PATTERN.test(ref) && value === value.toLowerCase() ? ref : null;
};

const parts = (step: CheckoutStep, ref?: string): string[] => {
  switch (step) {
    case 'compose':
      return ['compose'];
    case 'cart':
      return ['cart'];
    case 'resume':
      return ['cart', 'resume'];
    case 'unsubscribe':
      return ['cart', 'unsubscribe'];
    case 'details':
    case 'payment':
    case 'status':
      return ['checkout', step];
    case 'find':
      return ['booking', 'find'];
    case 'booking':
      return ['booking', ref ?? ''];
    case 'balance':
    case 'cancel':
      return ['booking', ref ?? '', step];
    default: {
      const unreachable: never = step;
      return unreachable;
    }
  }
};

const isKey = (value: string): boolean =>
  value === 'compose' || value === 'cart' || value === 'checkout' || value === 'booking';

/** URL publique d'une étape dans une langue (sans paramètre de requête). */
export const checkoutPath = (locale: Locale, step: CheckoutStep, ref?: string): string =>
  [
    '',
    locale,
    ...parts(step, ref === undefined ? undefined : refInUrl(ref)).map((part) =>
      isKey(part) || SEGMENTS.en[part] ? (SEGMENTS[locale][part] ?? part) : part,
    ),
  ].join('/');

/** Chemin interne (route Next) d'une étape. */
export const internalCheckoutPath = (locale: Locale, step: CheckoutStep, ref?: string): string =>
  ['', locale, INTERNAL_TUNNEL_SEGMENT, ...parts(step, ref)].join('/');

/** Page du tunnel (URL publique traduite ou route interne) : jamais indexée ni listée. */
export const isTunnelPath = (pathname: string): boolean => {
  const [, locale = '', section = ''] = pathname.split('/');
  return (
    (isLocale(locale) && section === INTERNAL_TUNNEL_SEGMENT) ||
    parseCheckoutPath(pathname) !== null
  );
};

/** Étape correspondant à une URL publique, ou `null`. */
export const parseCheckoutPath = (
  pathname: string,
): { locale: Locale; route: CheckoutRoute } | null => {
  const [, locale = '', first = '', second, third, ...rest] = pathname.split('/');
  if (!isLocale(locale) || rest.length > 0) return null;
  const segment = SEGMENTS[locale];
  // Composer mon séjour (maquette) : `/fr/composer`, `/en/compose`.
  if (first === segment.compose) {
    return second === undefined ? { locale, route: { step: 'compose' } } : null;
  }
  if (first === segment.cart) {
    if (second === undefined && third === undefined) return { locale, route: { step: 'cart' } };
    if (second === segment.resume && third === undefined)
      return { locale, route: { step: 'resume' } };
    if (second === segment.unsubscribe && third === undefined)
      return { locale, route: { step: 'unsubscribe' } };
    return null;
  }
  if (first === segment.checkout && third === undefined) {
    if (second === segment.details) return { locale, route: { step: 'details' } };
    if (second === segment.payment) return { locale, route: { step: 'payment' } };
    if (second === segment.status) return { locale, route: { step: 'status' } };
    return null;
  }
  if (first === segment.booking && second !== undefined) {
    if (second === segment.find && third === undefined) return { locale, route: { step: 'find' } };
    const ref = refFromUrl(second);
    if (!ref) return null;
    if (third === undefined) return { locale, route: { step: 'booking', ref } };
    if (third === segment.balance) return { locale, route: { step: 'balance', ref } };
    if (third === segment.cancel) return { locale, route: { step: 'cancel', ref } };
  }
  return null;
};
