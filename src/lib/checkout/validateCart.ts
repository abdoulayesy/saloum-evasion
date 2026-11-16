// Cohérence du panier (002, T016 ; FR-004). Module pur : vérifie la composition et les dates des
// lignes avant le paiement. La disponibilité réelle est confirmée ensuite par l'équipe (Q1 B).

import { daysBetween } from './deposit';

export type OfferType = 'stay' | 'accommodation' | 'experience' | 'table' | 'transfer';

export type CartLine = {
  lineId: string;
  offerType: OfferType;
  /** Nuits (séjour, hébergement) : arrivée ; autres : date de la prestation. */
  startDate: string;
  /** Nuits uniquement : départ (> arrivée). */
  endDate?: string;
  transferDirection?: 'outbound' | 'return';
  adults: number;
  children: number;
  infants: number;
  /** Capacité de l'offre (places, bébés compris). */
  capacity: number;
  /** Hébergement : nombre minimum de nuits. */
  minNights?: number;
};

export type CartIssueCode =
  | 'multiple_lodgings'
  | 'stay_excludes_accommodation'
  | 'invalid_nights'
  | 'below_min_nights'
  | 'outside_stay_dates'
  | 'return_before_outbound'
  | 'over_capacity'
  | 'no_adult'
  | 'too_soon';

export type CartIssue = { lineId: string; code: CartIssueCode };

const NIGHT_TYPES: ReadonlySet<OfferType> = new Set(['stay', 'accommodation']);

const isLodging = (line: CartLine): boolean => NIGHT_TYPES.has(line.offerType);

const lineIssues = (line: CartLine, today: string, minLeadDays: number): CartIssueCode[] => {
  const issues: CartIssueCode[] = [];
  if (line.adults < 1) issues.push('no_adult');
  if (line.adults + line.children + line.infants > line.capacity) issues.push('over_capacity');
  if (daysBetween(today, line.startDate) < minLeadDays) issues.push('too_soon');
  if (isLodging(line)) {
    const nights = line.endDate ? daysBetween(line.startDate, line.endDate) : 0;
    if (nights < 1) issues.push('invalid_nights');
    else if (line.minNights !== undefined && nights < line.minNights)
      issues.push('below_min_nights');
  }
  return issues;
};

const compositionIssues = (lines: readonly CartLine[]): CartIssue[] => {
  const lodgings = lines.filter(isLodging);
  const extra = lodgings.slice(1);
  const hasStay = lodgings.some((line) => line.offerType === 'stay');
  const hasAccommodation = lodgings.some((line) => line.offerType === 'accommodation');
  const code: CartIssueCode =
    hasStay && hasAccommodation ? 'stay_excludes_accommodation' : 'multiple_lodgings';
  return extra.map((line) => ({ lineId: line.lineId, code }));
};

/** Prestations datées hors de la période [arrivée, départ] du séjour ou de l'hébergement. */
const dateIssues = (lines: readonly CartLine[]): CartIssue[] => {
  const lodging = lines.find(isLodging);
  if (!lodging?.endDate) return [];
  const { startDate, endDate } = lodging;
  return lines
    .filter((line) => !isLodging(line) && (line.startDate < startDate || line.startDate > endDate))
    .map((line) => ({ lineId: line.lineId, code: 'outside_stay_dates' }));
};

const transferIssues = (lines: readonly CartLine[]): CartIssue[] => {
  const outbound = lines.find(
    (line) => line.offerType === 'transfer' && line.transferDirection === 'outbound',
  );
  if (!outbound) return [];
  return lines
    .filter(
      (line) =>
        line.offerType === 'transfer' &&
        line.transferDirection === 'return' &&
        line.startDate <= outbound.startDate,
    )
    .map((line) => ({ lineId: line.lineId, code: 'return_before_outbound' }));
};

/** Toutes les incohérences du panier (liste vide = panier payable). */
export const validateCart = (
  lines: readonly CartLine[],
  { today, minLeadDays = 1 }: { today: string; minLeadDays?: number },
): CartIssue[] => [
  ...lines.flatMap((line) =>
    lineIssues(line, today, minLeadDays).map((code) => ({ lineId: line.lineId, code })),
  ),
  ...compositionIssues(lines),
  ...dateIssues(lines),
  ...transferIssues(lines),
];

/** Première date du panier : sert à l'acompte, aux échéances et à l'annulation. */
export const firstArrivalDate = (lines: readonly CartLine[]): string | null =>
  lines.reduce<string | null>(
    (first, line) => (first === null || line.startDate < first ? line.startDate : first),
    null,
  );
