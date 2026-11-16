import { fileURLToPath } from 'node:url';
import { withPayload } from '@payloadcms/next/withPayload';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { renamedSegments } from './src/i18n/renamedSegments';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Politique de sécurité du contenu (T173) : ressources du site seulement, plus Mux (vidéo HLS,
// vignettes) et Plausible (mesure). `unsafe-inline` reste nécessaire aux scripts et styles
// intégrés de Next sur des pages statiques (un nonce imposerait un rendu dynamique). En
// développement, pas de CSP : le rechargement à chaud utilise `eval`.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://plausible.io",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://image.mux.com",
  "font-src 'self'",
  "connect-src 'self' https://plausible.io https://*.mux.com",
  "media-src 'self' blob: https://*.mux.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const securityHeaders = [
  ...(process.env.NODE_ENV === 'production'
    ? [{ key: 'Content-Security-Policy', value: contentSecurityPolicy }]
    : []),
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Referer limité au domaine pour les tiers ; complet en interne (bascule de langue).
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Les redirections de barre oblique finale passent par le middleware (301, un seul saut).
  skipTrailingSlashRedirect: true,
  // Racine explicite : évite que Next détecte un lockfile dans un dossier parent.
  outputFileTracingRoot: fileURLToPath(new URL('.', import.meta.url)),
  // Images (T074, constitution II) : AVIF puis WebP, tailles pensées d'abord pour le mobile.
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 414, 640, 768, 1024, 1280, 1600],
    imageSizes: [96, 160, 240, 320],
    qualities: [50, 60],
  },
  // Polices des images de partage, lues sur disque au rendu (next/og).
  outputFileTracingIncludes: { '/**': ['./src/assets/fonts/**'] },
  // Segments fixes renommés : 301 de l'ancien préfixe vers le nouveau (src/i18n/renamedSegments.ts).
  redirects: async () =>
    renamedSegments.flatMap(({ from, to }) => [
      { source: from, destination: to, statusCode: 301 },
      { source: `${from}/:rest*`, destination: `${to}/:rest*`, statusCode: 301 },
    ]),
  headers: async () => [
    // Polices versionnées (nom de fichier) : cache immuable d'un an.
    {
      source: '/fonts/:file*',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    },
    // Admin et API jamais indexés (contrat routes.md), en plus du Disallow de robots.txt.
    { source: '/admin/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    { source: '/admin', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    { source: '/api/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    // En-têtes de sécurité du site public (T173), hors admin et API.
    { source: '/((?!admin|api).*)', headers: securityHeaders },
  ],
};

const withPayloadConfig = withPayload(withNextIntl(nextConfig), { devBundleServerPackages: false });
const payloadHeaders = withPayloadConfig.headers;

// withPayload ajoute `Accept-CH` + `Critical-CH: Sec-CH-Prefers-Color-Scheme` sur TOUTES les URL
// (thème clair/sombre de l'admin). `Critical-CH` force Chrome à recommencer la navigation pour
// envoyer l'indice : un aller-retour réseau perdu avant le HTML sur chaque page publique (LCP).
// Ces en-têtes sont limités à l'admin, seul consommateur de l'indice.
const ADMIN_SOURCES = ['/admin', '/admin/:path*'];

export default {
  ...withPayloadConfig,
  headers: async () => {
    const rules = payloadHeaders ? await payloadHeaders() : [];
    return rules.flatMap((rule) =>
      rule.source === '/:path*' && rule.headers.some((header) => header.key === 'Critical-CH')
        ? ADMIN_SOURCES.map((source) => ({ ...rule, source }))
        : [rule],
    );
  },
} satisfies NextConfig;
