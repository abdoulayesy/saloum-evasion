import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';

// Contrat routes.md « robots.txt » : les pages de demande ne sont pas bloquées
// (Google doit lire leur noindex), seuls l'admin et l'API le sont.
const robots = (): MetadataRoute.Robots => ({
  rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api'] }],
  sitemap: absoluteUrl('/sitemap.xml'),
});

export default robots;
