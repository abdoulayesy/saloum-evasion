import type { Booking } from '@/payload-types';
import type { EmailContent } from '../email';
import type { WhatsAppTemplate } from '../whatsapp';

// Mise à jour de disponibilité envoyée au voyageur (002, T062) quand l'équipe confirme ou signale
// une prestation indisponible. Le lien mène à « Retrouver ma réservation » (le jeton de gestion
// n'est conservé qu'haché).

const COPY = {
  fr: {
    subject: (reference: string) => `Votre réservation ${reference} : disponibilités mises à jour`,
    hello: (name: string) => `Bonjour ${name},`,
    intro: 'Voici l’état de chaque prestation de votre réservation :',
    status: {
      pending: 'en cours de confirmation',
      confirmed: 'confirmée',
      unavailable: 'indisponible : notre équipe vous propose une solution très vite',
      replaced: 'remplacée',
    },
    link: 'Retrouver ma réservation',
  },
  en: {
    subject: (reference: string) => `Your booking ${reference}: availability updated`,
    hello: (name: string) => `Hello ${name},`,
    intro: 'Here is the status of each service in your booking:',
    status: {
      pending: 'being confirmed',
      confirmed: 'confirmed',
      unavailable: 'unavailable: our team will offer you a solution very soon',
      replaced: 'replaced',
    },
    link: 'Find my booking',
  },
} as const;

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

export const availabilityUpdateEmail = (booking: Booking, findUrl: string): EmailContent => {
  const copy = COPY[booking.locale];
  const rows = (booking.lines ?? [])
    .filter((line) => !line.cancelled)
    .map((line) => `${line.title} : ${copy.status[line.availabilityStatus]}`);
  return {
    subject: copy.subject(booking.reference),
    text: [
      copy.hello(booking.traveller.firstName),
      '',
      copy.intro,
      ...rows.map((row) => `- ${row}`),
      '',
      `${copy.link} : ${findUrl}`,
    ].join('\n'),
    html: `<!doctype html><html lang="${booking.locale}"><body style="font-family:sans-serif;color:#0f2a24">
<p>${escapeHtml(copy.hello(booking.traveller.firstName))}</p><p>${escapeHtml(copy.intro)}</p>
<ul>${rows.map((row) => `<li>${escapeHtml(row)}</li>`).join('')}</ul>
<p><a href="${escapeHtml(findUrl)}">${escapeHtml(copy.link)}</a></p></body></html>`,
  };
};

/** Modèle `availability_update` : {{1}} prénom, {{2}} référence. */
export const availabilityUpdateWhatsApp = (booking: Booking): WhatsAppTemplate => ({
  name: 'availability_update',
  locale: booking.locale,
  params: [booking.traveller.firstName, booking.reference],
});
