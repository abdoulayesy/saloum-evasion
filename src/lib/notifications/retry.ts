// Politique d'envoi des notifications (002, T034 ; FR-023) : 4 tentatives à 0, 1, 5 et 30 minutes,
// puis escalade vers l'équipe (adresse de secours). Pure et testable.

export const RETRY_DELAYS_MINUTES = [0, 1, 5, 30] as const;

export const MAX_ATTEMPTS = RETRY_DELAYS_MINUTES.length;

export type NextStep = { action: 'retry'; delayMs: number } | { action: 'escalate' };

/** Étape suivante après `attemptsDone` tentatives échouées. */
export const nextStep = (attemptsDone: number): NextStep => {
  const delay = RETRY_DELAYS_MINUTES[attemptsDone];
  return delay === undefined
    ? { action: 'escalate' }
    : { action: 'retry', delayMs: delay * 60_000 };
};
