// Plan de paiement : acompte ou paiement total (002, T014 ; FR-016). Module pur. Les dates sont
// des dates civiles AAAA-MM-JJ (fuseau Africa/Dakar = UTC, sans heure d'été).

export type DepositSettings = {
  depositPercent: number;
  depositThresholdDays: number;
  balanceDueDaysBeforeArrival: number;
};

export const DEFAULT_DEPOSIT_SETTINGS: DepositSettings = {
  depositPercent: 30,
  depositThresholdDays: 30,
  balanceDueDaysBeforeArrival: 14,
};

const DAY_MS = 24 * 60 * 60 * 1000;

const utcTime = (iso: string): number => Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);

/** Nombre de jours civils de `from` à `to` (négatif si `to` est passé). */
export const daysBetween = (from: string, to: string): number =>
  Math.round((utcTime(to) - utcTime(from)) / DAY_MS);

export const addDays = (iso: string, days: number): string =>
  new Date(utcTime(iso) + days * DAY_MS).toISOString().slice(0, 10);

type EligibilityInput = {
  today: string;
  firstArrivalDate: string;
  /** Vrai si au moins une offre du panier l'exige. */
  requireFullPayment: boolean;
  settings?: DepositSettings;
};

export const isDepositEligible = ({
  today,
  firstArrivalDate,
  requireFullPayment,
  settings = DEFAULT_DEPOSIT_SETTINGS,
}: EligibilityInput): boolean =>
  !requireFullPayment && daysBetween(today, firstArrivalDate) > settings.depositThresholdDays;

export type PaymentPlan =
  | { plan: 'full'; depositAmount: 0; balanceAmount: 0; balanceDueDate: null; amountDueNow: number }
  | {
      plan: 'deposit';
      depositAmount: number;
      balanceAmount: number;
      balanceDueDate: string;
      amountDueNow: number;
    };

/** Acompte arrondi à la centaine de francs supérieure, jamais au-delà du total. */
export const depositAmount = (total: number, percent: number): number =>
  Math.min(total, Math.ceil((total * percent) / 10_000) * 100);

export const paymentPlan = (input: EligibilityInput & { total: number }): PaymentPlan => {
  const settings = input.settings ?? DEFAULT_DEPOSIT_SETTINGS;
  if (!isDepositEligible({ ...input, settings })) {
    return {
      plan: 'full',
      depositAmount: 0,
      balanceAmount: 0,
      balanceDueDate: null,
      amountDueNow: input.total,
    };
  }
  const deposit = depositAmount(input.total, settings.depositPercent);
  return {
    plan: 'deposit',
    depositAmount: deposit,
    balanceAmount: input.total - deposit,
    balanceDueDate: addDays(input.firstArrivalDate, -settings.balanceDueDaysBeforeArrival),
    amountDueNow: deposit,
  };
};
