import { fileURLToPath } from 'node:url';
import { withPayload } from '@payloadcms/next/withPayload';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { renamedSegments } from './src/i18n/renamedSegments';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

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
