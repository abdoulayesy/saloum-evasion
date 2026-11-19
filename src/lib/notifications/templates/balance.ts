import { bookingSummarySource } from '@/lib/booking/summarySource';
import { formatDate, summaryText, summaryTotals } from '@/lib/checkout/summary';
import { formatXof } from '@/lib/pricing';
import type { Booking } from '@/payload-types';
import type { EmailContent } from '../email';
import type { WhatsAppTemplate } from '../whatsapp';

// Solde d'une réservation avec acompte (002, US2, T072 ; contrat notifications) :
// - `balance_due` : lien de paiement du solde à J-21 puis la veille de la date limite ;
// - `balance_overdue` : dernier rappel au voyageur à la date limite (même modèle WhatsApp) et
//   alerte de l'équipe, sans annulation automatique ;
// - `balance_paid` : confirmation du solde, bon PDF mis à jour joint à l'e-mail.

type Locale = Booking['locale'];

const COPY = {
  fr: {
    dueSubject: (reference: string) => `Solde de votre réservation ${reference}`,
    overdueSubject: (reference: string) =>
      `Dernier rappel : solde de votre réservation ${reference}`,
    paidSubject: (reference: string) => `Solde reçu : réservation ${reference} payée`,
    hello: (name: string) => `Bonjour ${name},`,
    due: (amount: string, date: string) =>
      `Il reste ${amount} à régler pour votre séjour, avant le ${date}. Vous pouvez payer par Wave, Orange Money ou carte bancaire depuis le lien ci-dessous.`,
    overdue: (amount: string, date: string) =>
      `Le solde de ${amount} était à régler avant le ${date}. Votre réservation est maintenue : réglez-le dès que possible depuis le lien ci-dessous, ou écrivez-nous sur WhatsApp si vous avez besoin d’un délai.`,
    paid: 'Merci : le solde est payé, votre réservation est entièrement réglée.',
    reference: 'Référence',
    payBalance: 'Payer le solde',
    manage: 'Voir ou gérer ma réservation',
    voucher: 'Votre bon de réservation à jour est joint à ce message (PDF).',
    signature: 'À très vite dans le Saloum,\nl’équipe Saloum Évasion',
  },
  en: {
    dueSubject: (reference: string) => `Balance for your booking ${reference}`,
    overdueSubject: (reference: string) => `Final reminder: balance for your booking ${reference}`,
    paidSubject: (reference: string) => `Balance received: booking ${reference} fully paid`,
    hello: (name: string) => `Hello ${name},`,
    due: (amount: string, date: string) =>
      `${amount} remains to be paid for your stay, before ${date}. You can pay by Wave, Orange Money or bank card from the link below.`,
    overdue: (amount: string, date: string) =>
      `The balance of ${amount} was due before ${date}. Your booking is kept: please pay it as soon as possible from the link below, or message us on WhatsApp if you need more time.`,
    paid: 'Thank you: the balance is paid, your booking is fully settled.',
    reference: 'Reference',
    payBalance: 'Pay the balance',
    manage: 'View or manage my booking',
    voucher: 'Your updated booking voucher is attached to this message (PDF).',
    signature: 'See you soon in the Saloum,\nthe Saloum Évasion team',
  },
} as const;

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const button = (href: string, label: string): string =>
  `<p><a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 20px;background:#0f2a24;color:#f4eee3;border-radius:6px;text-decoration:none">${escapeHtml(label)}</a></p>`;

const htmlPage = (locale: Locale, body: string): string =>
  `<!doctype html><html lang="${locale}"><body style="font-family:sans-serif;color:#0f2a24;line-height:1.5">${body}</body></html>`;

const balanceFigures = (booking: Booking) => ({
  amount: formatXof(booking.balanceAmount),
  date: booking.balanceDueDate ? formatDate(booking.balanceDueDate, booking.locale) : '',
});

/** Lien du solde (J-21, veille) ou dernier rappel (date limite) au voyageur. */
export const balanceReminderEmail = (
  booking: Booking,
  balanceUrl: string,
  kind: 'balance_due' | 'balance_overdue',
): EmailContent => {
  const copy = COPY[booking.locale];
  const { amount, date } = balanceFigures(booking);
  const message = kind === 'balance_due' ? copy.due(amount, date) : copy.overdue(amount, date);
  const subject =
    kind === 'balance_due'
      ? copy.dueSubject(booking.reference)
      : copy.overdueSubject(booking.reference);
  const summary = summaryText(bookingSummarySource(booking));
  const text = [
    copy.hello(booking.traveller.firstName),
    '',
    message,
    '',
    `${copy.reference} : ${booking.reference}`,
    summary,
    '',
    `${copy.payBalance} : ${balanceUrl}`,
    '',
    copy.signature,
  ].join('\n');
  const html = htmlPage(
    booking.locale,
    `<p>${escapeHtml(copy.hello(booking.traveller.firstName))}</p>
<p>${escapeHtml(message)}</p>
<p>${escapeHtml(copy.reference)} : <strong>${escapeHtml(booking.reference)}</strong></p>
${button(balanceUrl, copy.payBalance)}
<p style="white-space:pre-line">${escapeHtml(copy.signature)}</p>`,
  );
  return { subject, text, html };
};

/**
 * Modèle WhatsApp `balance_due` (rappels et dernier rappel) : {{1}} prénom, {{2}} référence,
 * {{3}} montant du solde, {{4}} date limite, {{5}} lien de paiement du solde.
 */
export const balanceReminderWhatsApp = (booking: Booking, balanceUrl: string): WhatsAppTemplate => {
  const { amount, date } = balanceFigures(booking);
  return {
    name: 'balance_due',
    locale: booking.locale,
    params: [booking.traveller.firstName, booking.reference, amount, date, balanceUrl],
  };
};

/** Confirmation du solde payé (bon PDF mis à jour joint à l'envoi). */
export const balancePaidEmail = (booking: Booking, manageUrl: string): EmailContent => {
  const copy = COPY[booking.locale];
  const totals = summaryTotals(bookingSummarySource(booking));
  const text = [
    copy.hello(booking.traveller.firstName),
    '',
    copy.paid,
    `${copy.reference} : ${booking.reference} — ${totals.paid}`,
    '',
    `${copy.manage} : ${manageUrl}`,
    copy.voucher,
    '',
    copy.signature,
  ].join('\n');
  const html = htmlPage(
    booking.locale,
    `<p>${escapeHtml(copy.hello(booking.traveller.firstName))}</p>
<p><strong>${escapeHtml(copy.paid)}</strong></p>
<p>${escapeHtml(copy.reference)} : <strong>${escapeHtml(booking.reference)}</strong> — ${escapeHtml(totals.paid)}</p>
${button(manageUrl, copy.manage)}
<p>${escapeHtml(copy.voucher)}</p>
<p style="white-space:pre-line">${escapeHtml(copy.signature)}</p>`,
  );
  return { subject: copy.paidSubject(booking.reference), text, html };
};

/** Modèle WhatsApp `balance_paid` : {{1}} prénom, {{2}} référence, {{3}} lien de gestion. */
export const balancePaidWhatsApp = (booking: Booking, manageUrl: string): WhatsAppTemplate => ({
  name: 'balance_paid',
  locale: booking.locale,
  params: [booking.traveller.firstName, booking.reference, manageUrl],
});

/** Alerte de l'équipe : solde impayé à la date limite (toujours en français). */
export const teamBalanceOverdueEmail = (booking: Booking, adminUrl: string): EmailContent => {
  const amount = formatXof(booking.balanceAmount);
  const date = booking.balanceDueDate ? formatDate(booking.balanceDueDate, 'fr') : '—';
  const who = `${booking.traveller.firstName} ${booking.traveller.lastName}`;
  const text = [
    `Solde impayé à la date limite : ${booking.reference}.`,
    `Voyageur : ${who} — ${booking.traveller.whatsapp} — ${booking.traveller.email}`,
    `Solde : ${amount}, à régler avant le ${date}. Dernier rappel envoyé au voyageur.`,
    'Aucune annulation automatique : décider de la suite (contact, délai, annulation).',
    `Admin : ${adminUrl}`,
  ].join('\n');
  const html = `<p>Solde impayé à la date limite : <strong>${escapeHtml(booking.reference)}</strong>.</p>
<p>Voyageur : ${escapeHtml(who)} — ${escapeHtml(booking.traveller.whatsapp)} — ${escapeHtml(booking.traveller.email)}</p>
<p>Solde : ${escapeHtml(amount)}, à régler avant le ${escapeHtml(date)}. Dernier rappel envoyé au voyageur.</p>
<p>Aucune annulation automatique : décider de la suite (contact, délai, annulation).</p>
<p><a href="${escapeHtml(adminUrl)}">Ouvrir la réservation dans l’admin</a></p>`;
  return { subject: `[Solde impayé] ${booking.reference}`, text, html };
};
