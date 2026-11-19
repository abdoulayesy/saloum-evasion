// Rappels du solde (002, US2, FR-017 ; T067, T071). Module pur, dates civiles AAAA-MM-JJ
// (Africa/Dakar = UTC). Le lien de paiement part 7 jours avant la date limite (J-21 si le solde
// est exigible à J-14) puis la veille (J-15) ; à la date limite, l'équipe est alertée et le
// voyageur reçoit un dernier rappel. Aucune annulation automatique : l'équipe décide.
import { addDays } from './deposit';

export type BalanceReminderKind = 'balance_due' | 'balance_overdue';

export type BalanceReminderStep = {
  kind: BalanceReminderKind;
  /** Rang dans le journal `reminders` (index unique cible + type + canal + rang). */
  rank: 1 | 2;
  scheduledFor: string;
};

export const balanceReminderSteps = (balanceDueDate: string): BalanceReminderStep[] => [
  { kind: 'balance_due', rank: 1, scheduledFor: addDays(balanceDueDate, -7) },
  { kind: 'balance_due', rank: 2, scheduledFor: addDays(balanceDueDate, -1) },
  { kind: 'balance_overdue', rank: 1, scheduledFor: balanceDueDate },
];

type DueInput = {
  status: string;
  paymentPlan?: 'full' | 'deposit' | null;
  balanceDueDate?: string | null;
  today: string;
  /** Relances déjà enregistrées pour cette réservation. */
  sent: ReadonlyArray<{ kind: string; rank: number }>;
};

/**
 * Relance à envoyer aujourd'hui, ou `null`. Seule l'étape échue la plus récente compte : après
 * une interruption de la tâche, on n'envoie pas en rafale les rappels manqués.
 */
export const dueBalanceReminder = ({
  status,
  paymentPlan,
  balanceDueDate,
  today,
  sent,
}: DueInput): BalanceReminderStep | null => {
  if (status !== 'deposit_paid' || paymentPlan !== 'deposit' || !balanceDueDate) return null;
  const reached = balanceReminderSteps(balanceDueDate).filter((step) => step.scheduledFor <= today);
  const latest = reached.at(-1);
  if (!latest) return null;
  const already = sent.some((entry) => entry.kind === latest.kind && entry.rank === latest.rank);
  return already ? null : latest;
};
