import { fileURLToPath } from 'node:url';
import { withPayload } from '@payloadcms/next/withPayload';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Les redirections de barre oblique finale passent par le middleware (301, un seul saut).
  skipTrailingSlashRedirect: true,
  // Racine explicite : évite que Next détecte un lockfile dans un dossier parent.
  outputFileTracingRoot: fileURLToPath(new URL('.', import.meta.url)),
  // Polices des images de partage, lues sur disque au rendu (next/og).
  outputFileTracingIncludes: { '/**': ['./src/assets/fonts/**'] },
  headers: async () => [
    // Admin et API jamais indexés (contrat routes.md), en plus du Disallow de robots.txt.
    { source: '/admin/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    { source: '/admin', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    { source: '/api/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
  ],
};

export default withPayload(withNextIntl(nextConfig), { devBundleServerPackages: false });
