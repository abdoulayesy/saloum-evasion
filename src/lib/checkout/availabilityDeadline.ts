// Échéance de confirmation de disponibilité par l'équipe (002, FR-005, T063). Module pur.
// Heure de Dakar = UTC (pas d'heure d'été). Payé pendant les heures ouvrées avec une échéance
// avant la fermeture : paiement + délai ; sinon 10 h le lendemain (ou le jour même avant
// l'ouverture).

export type AvailabilitySla = { slaMinutes: number; businessStart: string; businessEnd: string };

const minutesOf = (hhmm: string): number => {
  const [hours = 0, minutes = 0] = hhmm.split(':').map(Number);
  return hours * 60 + minutes;
};

const MORNING_DEADLINE_MINUTES = 10 * 60;

const atMinutes = (day: Date, minutes: number): Date => {
  const result = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()));
  result.setUTCMinutes(minutes);
  return result;
};

export const availabilityDeadline = (paidAt: Date, sla: AvailabilitySla): Date => {
  const start = minutesOf(sla.businessStart);
  const end = minutesOf(sla.businessEnd);
  const paidMinutes = paidAt.getUTCHours() * 60 + paidAt.getUTCMinutes();
  if (paidMinutes < start) return atMinutes(paidAt, MORNING_DEADLINE_MINUTES);
  const due = new Date(paidAt.getTime() + sla.slaMinutes * 60_000);
  const sameDay = due.getUTCDate() === paidAt.getUTCDate();
  const dueMinutes = due.getUTCHours() * 60 + due.getUTCMinutes();
  if (sameDay && dueMinutes <= end) return due;
  const nextDay = new Date(paidAt.getTime() + 24 * 60 * 60_000);
  return atMinutes(nextDay, MORNING_DEADLINE_MINUTES);
};
