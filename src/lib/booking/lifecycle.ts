// Fin de vie des paniers et des réservations (002, T100 ; spec « Rétention », data-model). Pur.
// - Panier non commandé, sans modification depuis 30 jours : supprimé (s'il n'a aucune
//   réservation : une réservation garde son panier, relation obligatoire).
// - Réservation jamais payée, sans modification depuis 30 jours : `expired`. Pas avant : les
//   liens de reprise valent 7 jours et l'équipe suit les paniers abandonnés sur 30 jours.
// - Réservation payée (ou à acompte, ou partiellement annulée) dont la dernière prestation est
//   passée : `completed`.

export const PURGE_AFTER_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

const staleSince = (updatedAt: string, now: Date): boolean =>
  now.getTime() - new Date(updatedAt).getTime() >= PURGE_AFTER_DAYS * DAY_MS;

/** Date limite de dernière modification en deçà de laquelle un panier ou une réservation est périmé. */
export const purgeCutoff = (now: Date): string =>
  new Date(now.getTime() - PURGE_AFTER_DAYS * DAY_MS).toISOString();

export const isCartPurgeDue = (
  cart: { status: 'open' | 'checked_out' | 'abandoned' | 'expired'; updatedAt: string },
  now: Date,
): boolean => cart.status !== 'checked_out' && staleSince(cart.updatedAt, now);

export const isUnpaidBookingExpiryDue = (
  booking: { status: string; amountPaid: number; updatedAt: string },
  now: Date,
): boolean =>
  booking.status === 'awaiting_payment' &&
  booking.amountPaid === 0 &&
  staleSince(booking.updatedAt, now);

type ServiceLine = { startDate: string; endDate?: string | null; cancelled?: boolean | null };

/** Dernier jour de prestation des lignes actives (départ, sinon date de la prestation). */
export const lastServiceDate = (lines: readonly ServiceLine[]): string | null =>
  lines
    .filter((line) => !line.cancelled)
    .map((line) => line.endDate || line.startDate)
    .reduce<string | null>((last, date) => (last === null || date > last ? date : last), null);

const COMPLETABLE = new Set(['paid', 'deposit_paid', 'partially_cancelled']);

/** Réservation à passer `completed` : dernière prestation antérieure à aujourd'hui (Dakar = UTC). */
export const isCompletionDue = (
  booking: { status: string; lines?: readonly ServiceLine[] | null },
  today: string,
): boolean => {
  if (!COMPLETABLE.has(booking.status)) return false;
  const last = lastServiceDate(booking.lines ?? []);
  return last !== null && last < today;
};
