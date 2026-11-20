// Relevé prestataire (002, US5, T093 ; FR-036 ; data-model « payouts »). Module pur.
// Relevé = écritures de commission de la période − reversements de la période. Les écritures
// portent le taux figé au paiement : un changement de taux n'a pas d'effet rétroactif (FR-034).
// Dates civiles en UTC (heure de Dakar, sans heure d'été).

export type StatementPeriod = { from: string; to: string };

export type StatementEntry = {
  bookingReference: string;
  lineId: string;
  lineTitle: string;
  kind: 'collected' | 'refund_adjustment';
  grossAmount: number;
  commissionAmount: number;
  partnerAmount: number;
  rateBp: number;
  occurredAt: string;
};

export type PayoutMethod = 'bank_transfer' | 'wave' | 'orange_money' | 'cash';

export type StatementPayout = {
  periodStart: string;
  periodEnd: string;
  amount: number;
  method: PayoutMethod;
  reference?: string | null;
  paidAt: string;
};

export type StatementTotals = {
  /** Encaissé (brut des écritures d'encaissement). */
  collected: number;
  /** Commission retenue à l'encaissement. */
  commission: number;
  /** Remboursé (positif). */
  refunded: number;
  /** Commission annulée par les remboursements (positif ; 0 pour le motif `partner`). */
  commissionReversed: number;
  netCommission: number;
  /** Part du prestataire après remboursements. */
  partnerDue: number;
  paidOut: number;
  /** Reste à reverser. */
  balance: number;
};

export type Statement = {
  period: StatementPeriod;
  entries: StatementEntry[];
  payouts: StatementPayout[];
  totals: StatementTotals;
};

const CIVIL_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;
export const MAX_PERIOD_DAYS = 366;

const isValidCivilDate = (value: string): boolean =>
  CIVIL_DATE.test(value) && new Date(`${value}T00:00:00.000Z`).toISOString().startsWith(value);

/** Erreurs de saisie d'une période (vide si valide). */
export const periodErrors = (period: StatementPeriod): string[] => {
  if (!isValidCivilDate(period.from) || !isValidCivilDate(period.to))
    return ['Dates au format AAAA-MM-JJ.'];
  if (period.from > period.to) return ['La date de début doit précéder la date de fin.'];
  const days = (Date.parse(period.to) - Date.parse(period.from)) / DAY_MS + 1;
  return days > MAX_PERIOD_DAYS ? [`Période de ${MAX_PERIOD_DAYS} jours au plus.`] : [];
};

/** Mois civil contenant `today` (période proposée par défaut). */
export const monthOf = (today: string): StatementPeriod => {
  const [year = 1970, month = 1] = today.split('-').map(Number);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const prefix = today.slice(0, 7);
  return { from: `${prefix}-01`, to: `${prefix}-${String(last).padStart(2, '0')}` };
};

const dayOf = (iso: string): string => iso.slice(0, 10);

const entryInPeriod = (entry: StatementEntry, period: StatementPeriod): boolean =>
  dayOf(entry.occurredAt) >= period.from && dayOf(entry.occurredAt) <= period.to;

/** Un reversement appartient au relevé si la période qu'il couvre y est entièrement incluse. */
const payoutInPeriod = (payout: StatementPayout, period: StatementPeriod): boolean =>
  payout.periodStart >= period.from && payout.periodEnd <= period.to;

const sum = <T>(items: readonly T[], amount: (item: T) => number): number =>
  items.reduce((total, item) => total + amount(item), 0);

export const buildStatement = ({
  period,
  entries,
  payouts,
}: {
  period: StatementPeriod;
  entries: readonly StatementEntry[];
  payouts: readonly StatementPayout[];
}): Statement => {
  const inPeriod = entries
    .filter((entry) => entryInPeriod(entry, period))
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  const paid = payouts
    .filter((payout) => payoutInPeriod(payout, period))
    .sort((a, b) => a.paidAt.localeCompare(b.paidAt));
  const collected = inPeriod.filter((entry) => entry.kind === 'collected');
  const adjustments = inPeriod.filter((entry) => entry.kind === 'refund_adjustment');
  const commission = sum(collected, (entry) => entry.commissionAmount);
  const commissionReversed = 0 - sum(adjustments, (entry) => entry.commissionAmount);
  const partnerDue = sum(inPeriod, (entry) => entry.partnerAmount);
  const paidOut = sum(paid, (payout) => payout.amount);
  return {
    period,
    entries: inPeriod,
    payouts: paid,
    totals: {
      collected: sum(collected, (entry) => entry.grossAmount),
      commission,
      refunded: 0 - sum(adjustments, (entry) => entry.grossAmount),
      commissionReversed,
      netCommission: commission - commissionReversed,
      partnerDue,
      paidOut,
      balance: partnerDue - paidOut,
    },
  };
};

export const ENTRY_KIND_LABELS: Record<StatementEntry['kind'], string> = {
  collected: 'Encaissement',
  refund_adjustment: 'Ajustement de remboursement',
};

export const PAYOUT_METHOD_LABELS: Record<PayoutMethod, string> = {
  bank_transfer: 'Virement bancaire',
  wave: 'Wave',
  orange_money: 'Orange Money',
  cash: 'Espèces',
};

/** Taux en pourcentage, virgule décimale (tableur français) : 1250 → « 12,5 ». */
export const ratePercent = (rateBp: number): string => String(rateBp / 100).replace('.', ',');

const FORMULA_START = /^[=+\-@\t\r]/;

/**
 * Cellule CSV : un texte qui commencerait une formule est précédé d'une apostrophe (injection
 * de formule) ; guillemets si la cellule contient `;`, un guillemet ou un saut de ligne.
 */
export const csvCell = (value: string | number): string => {
  if (typeof value === 'number') return String(value);
  const text = FORMULA_START.test(value) ? `'${value}` : value;
  return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const row = (...cells: (string | number)[]): string => cells.map(csvCell).join(';');

/** Export tableur du relevé : `;`, UTF-8 avec BOM, fins de ligne CRLF. */
export const statementCsv = ({
  partnerName,
  statement,
}: {
  partnerName: string;
  statement: Statement;
}): string => {
  const { period, entries, payouts, totals } = statement;
  const lines = [
    row('Relevé prestataire', partnerName),
    row('Période', period.from, period.to),
    '',
    row(
      'Date',
      'Réservation',
      'Prestation',
      'Nature',
      'Montant brut (FCFA)',
      'Taux (%)',
      'Commission (FCFA)',
      'Part prestataire (FCFA)',
    ),
    ...entries.map((entry) =>
      row(
        dayOf(entry.occurredAt),
        entry.bookingReference,
        entry.lineTitle,
        ENTRY_KIND_LABELS[entry.kind],
        entry.grossAmount,
        ratePercent(entry.rateBp),
        entry.commissionAmount,
        entry.partnerAmount,
      ),
    ),
    '',
    row('Reversements'),
    row('Versé le', 'Début de période', 'Fin de période', 'Moyen', 'Référence', 'Montant (FCFA)'),
    ...payouts.map((payout) =>
      row(
        dayOf(payout.paidAt),
        payout.periodStart,
        payout.periodEnd,
        PAYOUT_METHOD_LABELS[payout.method],
        payout.reference ?? '',
        payout.amount,
      ),
    ),
    '',
    row('Totaux'),
    row('Encaissé', totals.collected),
    row('Commissions', totals.commission),
    row('Remboursé', totals.refunded),
    row('Commissions annulées', totals.commissionReversed),
    row('Commission nette', totals.netCommission),
    row('Part prestataire due', totals.partnerDue),
    row('Déjà reversé', totals.paidOut),
    row('Reste à reverser', totals.balance),
  ];
  return `﻿${lines.join('\r\n')}\r\n`;
};
