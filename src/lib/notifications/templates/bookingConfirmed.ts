import { bookingSummarySource } from '@/lib/booking/summarySource';
import { summaryLines, summaryTotals } from '@/lib/checkout/summary';
import type { Booking } from '@/payload-types';
import type { EmailContent } from '../email';
import type { WhatsAppTemplate } from '../whatsapp';

// Confirmation de réservation au voyageur (002, T061) : e-mail (texte + HTML) et paramètres du
// modèle WhatsApp `booking_confirmed`, en FR ou EN selon la langue de la réservation. Le
// récapitulatif vient de `summaryLines` (FR-010), le bon PDF est joint à l'envoi.

const COPY = {
  fr: {
    subject: (reference: string) => `Votre réservation ${reference} est enregistrée`,
    hello: (name: string) => `Bonjour ${name},`,
    paid: 'Merci : votre paiement est confirmé.',
    pending:
      'Notre équipe confirme la disponibilité de chaque prestation dans les 2 heures (entre 8 h et 20 h, heure de Dakar).',
    reference: 'Référence',
    total: 'Total',
    paidAmount: 'Déjà payé',
    balance: (amount: string, date: string) => `Solde de ${amount} à régler avant le ${date}.`,
    manage: 'Voir ou gérer ma réservation',
    voucher: 'Votre bon de réservation est joint à ce message (PDF).',
    signature: 'À très vite dans le Saloum,\nl’équipe Saloum Évasion',
  },
  en: {
    subject: (reference: string) => `Your booking ${reference} is confirmed`,
    hello: (name: string) => `Hello ${name},`,
    paid: 'Thank you: your payment is confirmed.',
    pending:
      'Our team confirms the availability of each service within 2 hours (between 8 am and 8 pm, Dakar time).',
    reference: 'Reference',
    total: 'Total',
    paidAmount: 'Already paid',
    balance: (amount: string, date: string) => `Balance of ${amount} due before ${date}.`,
    manage: 'View or manage my booking',
    voucher: 'Your booking voucher is attached to this message (PDF).',
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

export const bookingConfirmedEmail = (booking: Booking, manageUrl: string): EmailContent => {
  const copy = COPY[booking.locale];
  const source = bookingSummarySource(booking);
  const lines = summaryLines(source).filter((line) => !line.cancelled);
  const totals = summaryTotals(source);
  const balance = totals.balance
    ? copy.balance(totals.balance.amount, totals.balance.dueDate)
    : null;
  const text = [
    copy.hello(booking.traveller.firstName),
    '',
    copy.paid,
    copy.pending,
    '',
    `${copy.reference} : ${booking.reference}`,
    ...lines.map((line) => `- ${line.title} — ${line.when} — ${line.travellers} — ${line.price}`),
    `${copy.total} : ${totals.total} (${totals.totalEur})`,
    `${copy.paidAmount} : ${totals.paid}`,
    ...(balance ? [balance] : []),
    '',
    `${copy.manage} : ${manageUrl}`,
    copy.voucher,
    '',
    copy.signature,
  ].join('\n');
  const html = `<!doctype html><html lang="${booking.locale}"><body style="font-family:sans-serif;color:#0f2a24;line-height:1.5">
<p>${escapeHtml(copy.hello(booking.traveller.firstName))}</p>
<p><strong>${escapeHtml(copy.paid)}</strong><br>${escapeHtml(copy.pending)}</p>
<p>${escapeHtml(copy.reference)} : <strong>${escapeHtml(booking.reference)}</strong></p>
<ul>${lines
    .map(
      (line) =>
        `<li><strong>${escapeHtml(line.title)}</strong><br>${escapeHtml(line.when)} — ${escapeHtml(line.travellers)}<br>${escapeHtml(line.price)}</li>`,
    )
    .join('')}</ul>
<p>${escapeHtml(copy.total)} : <strong>${escapeHtml(totals.total)}</strong> (${escapeHtml(totals.totalEur)})<br>
${escapeHtml(copy.paidAmount)} : ${escapeHtml(totals.paid)}${balance ? `<br>${escapeHtml(balance)}` : ''}</p>
<p><a href="${escapeHtml(manageUrl)}" style="display:inline-block;padding:12px 20px;background:#0f2a24;color:#f4eee3;border-radius:6px;text-decoration:none">${escapeHtml(copy.manage)}</a></p>
<p>${escapeHtml(copy.voucher)}</p>
<p style="white-space:pre-line">${escapeHtml(copy.signature)}</p>
</body></html>`;
  return { subject: copy.subject(booking.reference), text, html };
};

/** Modèle WhatsApp `booking_confirmed` : {{1}} prénom, {{2}} référence, {{3}} lien de gestion. */
export const bookingConfirmedWhatsApp = (
  booking: Booking,
  manageUrl: string,
): WhatsAppTemplate => ({
  name: 'booking_confirmed',
  locale: booking.locale,
  params: [booking.traveller.firstName, booking.reference, manageUrl],
});
