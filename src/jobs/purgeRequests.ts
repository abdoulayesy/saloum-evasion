import type { Payload } from 'payload';

// Rétention (T071, spec Assumptions, constitution IX) :
// - demandes de plus de 24 mois supprimées, sauf celles au statut « gagnée » (séjour vendu) ;
// - compteurs de limitation de débit purgés après 24 h.

export const REQUEST_RETENTION_MONTHS = 24;
export const RATE_LIMIT_RETENTION_HOURS = 24;

/** Date avant laquelle une demande non gagnée est supprimée. */
export const requestCutoff = (now: Date): Date => {
  const cutoff = new Date(now);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - REQUEST_RETENTION_MONTHS);
  return cutoff;
};

/** Date avant laquelle un compteur de limitation de débit est supprimé. */
export const rateLimitCutoff = (now: Date): Date =>
  new Date(now.getTime() - RATE_LIMIT_RETENTION_HOURS * 60 * 60 * 1000);

export type PurgeResult = { requests: number; rateLimits: number };

export const purgeExpiredData = async (
  payload: Payload,
  now = new Date(),
): Promise<PurgeResult> => {
  const requests = await payload.delete({
    collection: 'requests',
    where: {
      and: [
        { createdAt: { less_than: requestCutoff(now).toISOString() } },
        { status: { not_equals: 'won' } },
      ],
    },
    overrideAccess: true,
  });
  const rateLimits = await payload.delete({
    collection: 'rateLimits',
    where: { windowStart: { less_than: rateLimitCutoff(now).toISOString() } },
    overrideAccess: true,
  });
  return { requests: requests.docs.length, rateLimits: rateLimits.docs.length };
};
