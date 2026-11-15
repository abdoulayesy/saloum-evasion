// Règle de relance des notifications de demandes (T146), pure et testable : 3 essais au plus,
// puis une seule alerte vers l'adresse de secours, puis plus aucune action automatique.

export const MAX_NOTIFY_ATTEMPTS = 3;
/** Marqueur posé après l'alerte de secours. */
export const ALERTED_ATTEMPTS = MAX_NOTIFY_ATTEMPTS + 1;

export type RetryAction = 'skip' | 'retry' | 'alert';

export const retryAction = (request: {
  notifiedAt?: string | null;
  notifyAttempts?: number | null;
}): RetryAction => {
  if (request.notifiedAt) return 'skip';
  const attempts = request.notifyAttempts ?? 0;
  if (attempts < MAX_NOTIFY_ATTEMPTS) return 'retry';
  return attempts === MAX_NOTIFY_ATTEMPTS ? 'alert' : 'skip';
};
