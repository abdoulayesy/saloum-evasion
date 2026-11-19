// Récapitulatif d'une réservation (002, T016b ; FR-010) : source unique des lignes affichées par
// la page de confirmation, l'e-mail, le modèle WhatsApp et le bon PDF. Aucun de ces rendus ne
// recalcule une date, un effectif ou un prix : ils parcourent `summaryLines` tel quel.

import { formatEur, formatXof } from '@/lib/pricing';
import type { OfferType } from './validateCart';

type Locale = 'fr' | 'en';

export type SummarySourceLine = {
  lineId: string;
  offerType: OfferType;
  title: string;
  startDate: string;
  endDate?: string;
  slot?: string;
  transferDirection?: 'outbound' | 'return';
  transferTime?: string;
  adults: number;
  children: number;
  infants: number;
  lineTotal: number;
  cancelled?: boolean;
};

export type SummarySource = {
  locale: Locale;
  lines: readonly SummarySourceLine[];
  total: number;
  paymentPlan: 'full' | 'deposit';
  depositAmount: number;
  balanceAmount: number;
  balanceDueDate: string | null;
  amountPaid: number;
};

export type SummaryLine = {
  lineId: string;
  title: string;
  /** « du 10 au 14 févr. 2027 · 4 nuits », « 11 févr. 2027 · 09:00 », etc. */
  when: string;
  travellers: string;
  price: string;
  cancelled: boolean;
};

export type SummaryTotals = {
  total: string;
  totalEur: string;
  paid: string;
  /** Solde restant et échéance, en paiement avec acompte uniquement. */
  balance: { amount: string; dueDate: string } | null;
};

const dateFormat = (locale: Locale): Intl.DateTimeFormat =>
  new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

export const formatDate = (iso: string, locale: Locale): string =>
  dateFormat(locale).format(new Date(`${iso.slice(0, 10)}T00:00:00Z`));

const plural = (count: number, [one, other]: readonly [string, string]): string =>
  `${count} ${count > 1 ? other : one}`;

const WORDS = {
  fr: {
    adult: ['adulte', 'adultes'],
    child: ['enfant', 'enfants'],
    infant: ['bébé', 'bébés'],
    night: ['nuit', 'nuits'],
    range: (from: string, to: string) => `du ${from} au ${to}`,
    outbound: 'aller',
    return: 'retour',
  },
  en: {
    adult: ['adult', 'adults'],
    child: ['child', 'children'],
    infant: ['infant', 'infants'],
    night: ['night', 'nights'],
    range: (from: string, to: string) => `${from} to ${to}`,
    outbound: 'outbound',
    return: 'return',
  },
} as const;

const travellersLabel = (line: SummarySourceLine, locale: Locale): string => {
  const words = WORDS[locale];
  const parts = [plural(line.adults, words.adult)];
  if (line.children > 0) parts.push(plural(line.children, words.child));
  if (line.infants > 0) parts.push(plural(line.infants, words.infant));
  return parts.join(', ');
};

const nightsBetween = (start: string, end: string): number =>
  Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000);

const whenLabel = (line: SummarySourceLine, locale: Locale): string => {
  const words = WORDS[locale];
  const start = formatDate(line.startDate, locale);
  if (line.endDate) {
    const nights = plural(nightsBetween(line.startDate, line.endDate), words.night);
    return `${words.range(start, formatDate(line.endDate, locale))} · ${nights}`;
  }
  const details = [start];
  if (line.transferDirection) details.push(words[line.transferDirection]);
  if (line.transferTime) details.push(line.transferTime);
  if (line.slot) details.push(line.slot);
  return details.join(' · ');
};

/** Lignes du récapitulatif, dans l'ordre du panier. */
export const summaryLines = (booking: SummarySource): SummaryLine[] =>
  booking.lines.map((line) => ({
    lineId: line.lineId,
    title: line.title,
    when: whenLabel(line, booking.locale),
    travellers: travellersLabel(line, booking.locale),
    price: formatXof(line.lineTotal),
    cancelled: line.cancelled ?? false,
  }));

export const summaryTotals = (booking: SummarySource): SummaryTotals => ({
  total: formatXof(booking.total),
  totalEur: formatEur(booking.total, booking.locale),
  paid: formatXof(booking.amountPaid),
  // Solde affiché tant qu'il reste dû (acompte payé ou réservation encore impayée).
  balance:
    booking.paymentPlan === 'deposit' &&
    booking.balanceDueDate &&
    booking.amountPaid < booking.total
      ? {
          amount: formatXof(booking.balanceAmount),
          dueDate: formatDate(booking.balanceDueDate, booking.locale),
        }
      : null,
});

/** Version texte (WhatsApp, e-mail texte) : une ligne par prestation, sans recalcul. */
export const summaryText = (booking: SummarySource): string =>
  summaryLines(booking)
    .filter((line) => !line.cancelled)
    .map((line) => `• ${line.title} — ${line.when} — ${line.travellers} — ${line.price}`)
    .join('\n');
