import { NextResponse, type NextRequest } from 'next/server';
import { isLocale } from '@/i18n/routing';
import { parseCheckoutPath } from '@/lib/checkout/paths';
import { localeTarget } from '@/lib/localeSwitch';

// Sélecteur de langue (T156, US5) : le lien de l'en-tête mène ici avec la langue voulue ; la
// page d'origine vient du paramètre `from` (îlot client) ou, sans JavaScript, de l'en-tête
// Referer (même origine). Redirection 307 vers la page équivalente, ou vers la page parente
// avec `?from=missing` quand la traduction n'est pas publiée. Les pages restent statiques.
export const dynamic = 'force-dynamic';

const sameOriginUrl = (value: string | null, origin: string): URL | null => {
  if (!value) return null;
  try {
    const url = new URL(value, origin);
    return url.origin === origin ? url : null;
  } catch {
    return null;
  }
};

/** Paramètres d'accès du tunnel (paiement, jeton de gestion, jeton de relance) à conserver. */
const TUNNEL_PARAMS = ['p', 'k', 't'];

export const GET = async (request: NextRequest) => {
  const { searchParams, origin } = request.nextUrl;
  const to = searchParams.get('to') ?? '';
  if (!isLocale(to)) return NextResponse.json({ error: 'Langue inconnue' }, { status: 400 });
  const fromUrl =
    sameOriginUrl(searchParams.get('from'), origin) ??
    sameOriginUrl(request.headers.get('referer'), origin);
  const from = fromUrl?.pathname ?? `/${to}`;
  const target = await localeTarget(from, to);
  const url = new URL(target.path, origin);
  if (target.missing) url.searchParams.set('from', 'missing');
  // Étapes du tunnel : l'accès (paiement, réservation, reprise) suit dans l'autre langue.
  if (fromUrl && parseCheckoutPath(from)) {
    for (const key of TUNNEL_PARAMS) {
      const value = fromUrl.searchParams.get(key);
      if (value) url.searchParams.set(key, value);
    }
  }
  // Langue d'origine, pour l'évènement `language_switch` (retirée de l'URL à l'arrivée).
  const fromLocale = from.split('/')[1] ?? '';
  if (isLocale(fromLocale)) url.searchParams.set('switched', fromLocale);
  return NextResponse.redirect(url, {
    status: 307,
    headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
  });
};
