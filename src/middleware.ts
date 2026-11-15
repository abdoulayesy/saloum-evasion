import { NextResponse, type NextRequest } from 'next/server';
import { isLocale, routing } from '@/i18n/routing';

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
  return NextResponse.next();
};

export const config = {
  // Exclut les ressources techniques et tout fichier avec extension (sitemap.xml, robots.txt…).
  matcher: ['/((?!_next/|api/|admin|.*\\.[a-z0-9]+$).*)'],
};
