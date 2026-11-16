import { NextResponse, type NextRequest } from 'next/server';
import { buildPath } from '@/i18n/pathnames';
import { isLocale, routing } from '@/i18n/routing';
import {
  INTERNAL_TUNNEL_SEGMENT,
  internalCheckoutPath,
  parseCheckoutPath,
} from '@/lib/checkout/paths';

// Contrat routes.md « Redirections » : une seule redirection 301 au plus.
// - `/` → `/fr` (fixe, sans détection de langue, research R1) ;
// - barre oblique finale supprimée, chemin en minuscules ;
// - redirections du CMS (slug modifié, contenu dépublié), appliquées sur la forme canonique
//   pour rester en un seul saut.
// La redirection automatique de Next (308) est désactivée (`skipTrailingSlashRedirect`)
// pour que tout passe ici et reste en 301.
// Une URL sans préfixe de langue (ex. /es, /sejours) est réécrite, sans redirection, vers
// une route introuvable de la version française : elle reçoit la 404 localisée.

export const NOT_FOUND_REWRITE = `/${routing.defaultLocale}/_introuvable`;

export const canonicalPathname = (pathname: string): string => {
  const stripped = pathname.toLowerCase().replace(/\/+$/, '');
  return stripped === '' ? `/${routing.defaultLocale}` : stripped;
};

export const hasLocalePrefix = (pathname: string): boolean =>
  isLocale(pathname.split('/')[1] ?? '');

// --- Table des redirections du CMS -------------------------------------------------------
// Lue sur /api/redirect-table (cache serveur invalidé à chaque modification) et gardée en
// mémoire quelques secondes par instance du middleware.

const TABLE_TTL_MS = Number(process.env.REDIRECTS_TTL_MS ?? 30_000);

let cachedTable: { loadedAt: number; table: ReadonlyMap<string, string> } | null = null;

const isStringRecord = (value: unknown): value is Record<string, string> =>
  typeof value === 'object' &&
  value !== null &&
  Object.values(value).every((entry) => typeof entry === 'string');

const loadRedirectTable = async (origin: string): Promise<ReadonlyMap<string, string>> => {
  const now = Date.now();
  if (cachedTable && now - cachedTable.loadedAt < TABLE_TTL_MS) return cachedTable.table;
  try {
    const response = await fetch(`${origin}/api/redirect-table`, { cache: 'no-store' });
    const body: unknown = response.ok ? await response.json() : {};
    const table = new Map(isStringRecord(body) ? Object.entries(body) : []);
    cachedTable = { loadedAt: now, table };
    return table;
  } catch {
    // CMS indisponible : on sert la page demandée plutôt que de bloquer la navigation.
    return cachedTable?.table ?? new Map();
  }
};

const isLocaleRoot = (pathname: string): boolean => isLocale(pathname.slice(1));

// --- Demande de séjour (phase 8) ---------------------------------------------------------
// Pages dynamiques servies par des routes internes (`request-form`), isolées du résolveur
// des pages publiques (qui restent statiques). Les URL publiques traduites y sont réécrites ;
// l'accès direct aux routes internes reçoit la 404.

export const INTERNAL_REQUEST_SEGMENT = 'request-form';

// --- Tunnel de commande (002) ------------------------------------------------------------
// Même principe : URL traduites réécrites vers `/{langue}/tunnel/...` ; pages jamais indexées,
// jamais mises en cache partagé. Le Referer suit la politique du site
// (`strict-origin-when-cross-origin`, next.config.ts) : le chemin et le jeton de gestion ne
// partent jamais vers un tiers, mais le sélecteur de langue les lit sur notre domaine.

export const TUNNEL_HEADERS: Readonly<Record<string, string>> = {
  'X-Robots-Tag': 'noindex, nofollow',
  'Cache-Control': 'private, no-store',
};

export const tunnelRewrite = (pathname: string): string | 'blocked' | null => {
  const [, locale = '', section = ''] = pathname.split('/');
  if (!isLocale(locale)) return null;
  if (section === INTERNAL_TUNNEL_SEGMENT) return 'blocked';
  const parsed = parseCheckoutPath(pathname);
  return parsed ? internalCheckoutPath(parsed.locale, parsed.route.step, parsed.route.ref) : null;
};

export const requestRewrite = (pathname: string): string | 'blocked' | null => {
  const [, locale = '', section = ''] = pathname.split('/');
  if (!isLocale(locale)) return null;
  if (section === INTERNAL_REQUEST_SEGMENT) return 'blocked';
  if (pathname === buildPath(locale, { type: 'request' }))
    return `/${locale}/${INTERNAL_REQUEST_SEGMENT}`;
  if (pathname === buildPath(locale, { type: 'requestThanks' }))
    return `/${locale}/${INTERNAL_REQUEST_SEGMENT}/thanks`;
  return null;
};

export const middleware = async (request: NextRequest) => {
  const { pathname, search } = request.nextUrl;
  const canonical = canonicalPathname(pathname);
  const lookup =
    hasLocalePrefix(canonical) && !isLocaleRoot(canonical)
      ? (await loadRedirectTable(request.nextUrl.origin)).get(canonical)
      : undefined;
  const target = lookup ?? canonical;
  if (target !== pathname) {
    // URL construite à la main : `nextUrl.clone()` réappliquerait la barre oblique finale.
    return NextResponse.redirect(new URL(`${target}${search}`, request.url), 301);
  }
  if (!hasLocalePrefix(pathname)) {
    return NextResponse.rewrite(new URL(NOT_FOUND_REWRITE, request.url));
  }
  const internal = requestRewrite(pathname);
  if (internal === 'blocked') return NextResponse.rewrite(new URL(NOT_FOUND_REWRITE, request.url));
  if (internal) return NextResponse.rewrite(new URL(`${internal}${search}`, request.url));
  const tunnel = tunnelRewrite(pathname);
  if (tunnel === 'blocked') return NextResponse.rewrite(new URL(NOT_FOUND_REWRITE, request.url));
  if (tunnel) {
    const response = NextResponse.rewrite(new URL(`${tunnel}${search}`, request.url));
    for (const [key, value] of Object.entries(TUNNEL_HEADERS)) response.headers.set(key, value);
    return response;
  }
  return NextResponse.next();
};

export const config = {
  // Exclut les ressources techniques, la passerelle de test (/dev, 404 en production) et tout
  // fichier avec extension (sitemap.xml, robots.txt…).
  matcher: ['/((?!_next/|api/|og/|admin|dev/|.*\\.[a-z0-9]+$).*)'],
};
