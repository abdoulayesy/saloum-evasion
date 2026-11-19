// Relances d'un panier abandonné ou d'un paiement échoué (002, US3, FR-031 ; T078). Module pur.
// Le visiteur a saisi ses coordonnées et consenti aux relances, puis quitté le tunnel sans
// paiement confirmé : au plus deux relances, 1 h puis 24 h après sa dernière action (dernière
// écriture de la réservation `awaiting_payment` : coordonnées ou tentative de paiement).

export const ABANDON_REMINDER_DELAYS_HOURS = { 1: 1, 2: 24 } as const;
/** Au-delà, plus aucune relance (le lien de reprise ne vaut que 7 jours). */
export const ABANDON_REMINDER_WINDOW_DAYS = 7;

const HOUR_MS = 60 * 60 * 1000;

type AbandonInput = {
  consent: boolean;
  cartStatus: string;
  bookingStatus: string;
  /** Un paiement est en cours de confirmation : pas de relance pendant ce temps. */
  paymentInProgress: boolean;
  lastActivityAt: string;
  now: Date;
  sentRanks: readonly number[];
};

/** Rang de la relance à envoyer maintenant (1 ou 2), ou `null`. */
export const dueAbandonReminder = ({
  consent,
  cartStatus,
  bookingStatus,
  paymentInProgress,
  lastActivityAt,
  now,
  sentRanks,
}: AbandonInput): 1 | 2 | null => {
  if (!consent || cartStatus !== 'open' || bookingStatus !== 'awaiting_payment') return null;
  if (paymentInProgress) return null;
  const elapsedHours = (now.getTime() - new Date(lastActivityAt).getTime()) / HOUR_MS;
  if (elapsedHours > ABANDON_REMINDER_WINDOW_DAYS * 24) return null;
  // Seule l'étape échue la plus récente compte (pas de rafale après une interruption).
  const rank =
    elapsedHours >= ABANDON_REMINDER_DELAYS_HOURS[2]
      ? 2
      : elapsedHours >= ABANDON_REMINDER_DELAYS_HOURS[1]
        ? 1
        : null;
  if (rank === null || sentRanks.includes(rank) || sentRanks.length >= 2) return null;
  return rank;
};
