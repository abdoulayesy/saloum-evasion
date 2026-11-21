// Dates d'un guide (004, FR-006, FR-018, research R3). Pur, dates civiles AAAA-MM-JJ (heure de
// Dakar = UTC). `publishedOn` est figée à la première publication ; `updatedOn` ne change qu'à une
// mise à jour de fond signalée par l'équipe, jamais pour une correction mineure.

export type GuideDates = { publishedOn: string | null; updatedOn: string | null };

export const nextGuideDates = ({
  publishing,
  previous,
  substantive,
  today,
}: {
  publishing: boolean;
  previous: GuideDates;
  substantive: boolean;
  today: string;
}): GuideDates => {
  if (!publishing) return previous;
  const publishedOn = previous.publishedOn ?? today;
  const updatedOn = previous.updatedOn === null || substantive ? today : previous.updatedOn;
  return { publishedOn, updatedOn };
};

const REVIEW_MONTHS = 12;

/** Même jour un an plus tard (29 février → 28 février). */
const addMonths = (date: string, months: number): string => {
  const [year = 1970, month = 1, day = 1] = date.split('-').map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
};

/** Guide sans mise à jour de fond depuis plus de 12 mois. */
export const isReviewDue = (updatedOn: string | null, today: string): boolean =>
  updatedOn !== null && today > addMonths(updatedOn, REVIEW_MONTHS);
