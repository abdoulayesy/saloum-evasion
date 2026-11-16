import { timingSafeEqual } from 'node:crypto';

// Autorisation des tâches planifiées (Vercel Cron envoie `Authorization: Bearer CRON_SECRET`),
// comparaison à temps constant. Sans secret configuré, tout appel est refusé.
export const isCronAuthorized = (headers: Headers): boolean => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(headers.get('authorization') ?? '');
  return expected.length === received.length && timingSafeEqual(expected, received);
};
