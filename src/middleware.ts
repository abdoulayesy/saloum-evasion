import { NextResponse, type NextRequest } from 'next/server';
import { isLocale, routing } from '@/i18n/routing';

// Contrat routes.md « Redirections » : une seule redirection 301 au plus.
// - `/` → `/fr` (fixe, sans détection de langue, research R1) ;
// - barre oblique finale supprimée, chemin en minuscules.
// La redirection automatique de Next (308) est désactivée (`skipTrailingSlashRedirect`)
// pour que tout passe ici et reste en 301.
// Une URL sans préfixe de langue (ex. /es, /sejours) est réécrite, sans redirection, vers
// une route introuvable de la version française : elle reçoit la 404 localisée et complète
// (layout, styles, statut 404) au lieu d'une page d'erreur nue.

export const NOT_FOUND_REWRITE = `/${routing.defaultLocale}/_introuvable`;

export const canonicalPathname = (pathname: string): string => {
  const stripped = pathname.toLowerCase().replace(/\/+$/, '');
  return stripped === '' ? `/${routing.defaultLocale}` : stripped;
};

export const hasLocalePrefix = (pathname: string): boolean =>
  isLocale(pathname.split('/')[1] ?? '');

export const middleware = (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const target = canonicalPathname(pathname);
  if (target !== pathname) {
    // URL construite à la main : `nextUrl.clone()` réappliquerait la barre oblique finale.
    return NextResponse.redirect(new URL(`${target}${request.nextUrl.search}`, request.url), 301);
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
