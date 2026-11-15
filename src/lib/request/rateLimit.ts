import { createHash } from 'node:crypto';
import type { Payload } from 'payload';

// Limitation de débit du formulaire (T140, FR-014) : 5 demandes par heure et par adresse IP,
// comptées dans Postgres (collection `rateLimits`, purgée à 24 h). L'IP n'est jamais stockée
// en clair : empreinte SHA-256 salée (RATE_LIMIT_SALT).

export const DEFAULT_REQUESTS_PER_HOUR = 5;

/** Limite effective : 5 par défaut, réglable (`REQUEST_RATE_LIMIT`) pour les tests de bout en bout. */
export const requestsPerHour = (): number => {
  const configured = Number(process.env.REQUEST_RATE_LIMIT);
  return Number.isInteger(configured) && configured > 0 ? configured : DEFAULT_REQUESTS_PER_HOUR;
};
const WINDOW_MS = 60 * 60 * 1000;

export const hashIp = (ip: string, salt: string): string =>
  createHash('sha256').update(`${salt}:${ip}`).digest('hex');

/** Début de la fenêtre d'une heure qui contient `now`. */
export const windowStart = (now: Date): Date =>
  new Date(Math.floor(now.getTime() / WINDOW_MS) * WINDOW_MS);

/** Adresse IP du client derrière le proxy (première de x-forwarded-for). */
export const clientIp = (headers: Headers): string =>
  headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown';

export type RateLimitStore = {
  find: (ipHash: string, start: Date) => Promise<{ id: number | string; count: number } | null>;
  create: (ipHash: string, start: Date) => Promise<void>;
  increment: (id: number | string, count: number) => Promise<void>;
};

/** Compte une tentative ; `false` si la limite de la fenêtre est déjà atteinte. */
export const consumeRateLimit = async (
  store: RateLimitStore,
  ipHash: string,
  now: Date,
  limit = requestsPerHour(),
): Promise<boolean> => {
  const start = windowStart(now);
  const current = await store.find(ipHash, start);
  if (!current) {
    await store.create(ipHash, start);
    return true;
  }
  if (current.count >= limit) return false;
  await store.increment(current.id, current.count + 1);
  return true;
};

/** Stockage Payload (API locale, accès technique). */
export const payloadRateLimitStore = (payload: Payload): RateLimitStore => ({
  find: async (ipHash, start) => {
    const result = await payload.find({
      collection: 'rateLimits',
      where: {
        and: [{ ipHash: { equals: ipHash } }, { windowStart: { equals: start.toISOString() } }],
      },
      limit: 1,
      depth: 0,
    });
    const [doc] = result.docs;
    return doc ? { id: doc.id, count: doc.count } : null;
  },
  create: async (ipHash, start) => {
    await payload.create({
      collection: 'rateLimits',
      data: { ipHash, windowStart: start.toISOString(), count: 1 },
    });
  },
  increment: async (id, count) => {
    await payload.update({ collection: 'rateLimits', id, data: { count } });
  },
});
