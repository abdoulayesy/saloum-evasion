import { bookingSummarySource } from '@/lib/booking/summarySource';
import { summaryLines, summaryTotals } from '@/lib/checkout/summary';
import type { Booking } from '@/payload-types';
import type { EmailContent } from '../email';

// Notification de l'équipe pour chaque réservation payée (002, FR-025, T061) : toujours en
// français, avec toutes les lignes, les coordonnées, l'échéance de confirmation et le lien admin.

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

export const teamBookingEmail = (booking: Booking, adminUrl: string): EmailContent => {
  const source = bookingSummarySource({ ...booking, locale: 'fr' });
  const lines = summaryLines(source);
  const totals = summaryTotals(source);
  const deadline = booking.availabilityDeadline
    ? new Intl.DateTimeFormat('fr-SN', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'UTC',
      }).format(new Date(booking.availabilityDeadline))
    : '—';
  const rows: [string, string][] = [
    ['Référence', booking.reference],
    ['Voyageur', `${booking.traveller.firstName} ${booking.traveller.lastName}`],
    ['WhatsApp', booking.traveller.whatsapp],
    ['E-mail', booking.traveller.email],
    ['Langue', booking.locale === 'fr' ? 'Français' : 'Anglais'],
    ['Total', totals.total],
    ['Payé', totals.paid],
    ['Disponibilité à confirmer avant', `${deadline} (Dakar)`],
    ['Demande particulière', booking.specialRequest ?? '—'],
  ];
  const text = [
    `Nouvelle réservation payée ${booking.reference}`,
    '',
    ...rows.map(([label, value]) => `${label} : ${value}`),
    '',
    'Prestations :',
    ...lines.map((line) => `- ${line.title} — ${line.when} — ${line.travellers} — ${line.price}`),
    '',
    `Confirmer la disponibilité : ${adminUrl}`,
  ].join('\n');
  const html = `<!doctype html><html lang="fr"><body style="font-family:sans-serif;color:#0f2a24">
<h1 style="font-size:20px">Nouvelle réservation payée ${escapeHtml(booking.reference)}</h1>
<table style="border-collapse:collapse">${rows
    .map(
      ([label, value]) =>
        `<tr><th style="text-align:left;padding:4px 12px 4px 0">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`,
    )
    .join('')}</table>
<h2 style="font-size:16px">Prestations</h2>
<ul>${lines
    .map(
      (line) =>
        `<li>${escapeHtml(line.title)} — ${escapeHtml(line.when)} — ${escapeHtml(line.travellers)} — ${escapeHtml(line.price)}</li>`,
    )
    .join('')}</ul>
<p><a href="${escapeHtml(adminUrl)}">Confirmer la disponibilité dans l’administration</a></p>
</body></html>`;
  return {
    subject: `[Réservation ${booking.reference}] ${booking.traveller.firstName} ${booking.traveller.lastName} – ${totals.total}`,
    text,
    html,
  };
};
