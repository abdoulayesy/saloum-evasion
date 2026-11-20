import { bookingSummarySource } from '@/lib/booking/summarySource';
import { summaryText, summaryTotals } from '@/lib/checkout/summary';
import type { FailureReason } from '@/lib/payments/gateway';
import type { Booking } from '@/payload-types';
import type { EmailContent } from '../email';
import type { WhatsAppTemplate } from '../whatsapp';

// Relance d'un panier abandonné ou d'un paiement échoué (002, US3, T078, FR-031 ; contrat
// notifications `payment_failed_reminder`) : lien qui restaure le panier à l'étape de paiement
// (valable 7 jours) et désinscription en un geste, en FR ou EN selon la réservation.

const COPY = {
  fr: {
    subject: 'Votre séjour vous attend',
    hello: (name: string) => `Bonjour ${name},`,
    intro:
      'Votre réservation n’est pas encore payée. Votre panier est conservé : vous pouvez la finaliser en quelques secondes, par Wave, Orange Money ou carte bancaire.',
    failed: {
      declined: 'Le dernier paiement a été refusé.',
      insufficient_funds:
        'Le dernier paiement n’a pas abouti : le solde du compte était insuffisant.',
      timeout: 'Le délai du dernier paiement a été dépassé.',
      cancelled_by_user: 'Le dernier paiement a été annulé.',
      technical: 'Un problème technique a empêché le dernier paiement.',
    },
    total: 'Total',
    resume: 'Reprendre ma réservation',
    validity:
      'Ce lien est valable 7 jours. Les prix et disponibilités sont vérifiés à l’ouverture.',
    unsubscribe: 'Ne plus recevoir ces rappels',
    signature: 'L’équipe Saloum Évasion',
  },
  en: {
    subject: 'Your stay is waiting for you',
    hello: (name: string) => `Hello ${name},`,
    intro:
      'Your booking is not paid yet. Your cart is saved: you can complete it in a few seconds, by Wave, Orange Money or bank card.',
    failed: {
      declined: 'The last payment was declined.',
      insufficient_funds:
        'The last payment did not go through: the account balance was insufficient.',
      timeout: 'The last payment timed out.',
      cancelled_by_user: 'The last payment was cancelled.',
      technical: 'A technical problem prevented the last payment.',
    },
    total: 'Total',
    resume: 'Resume my booking',
    validity:
      'This link is valid for 7 days. Prices and availability are checked when you open it.',
    unsubscribe: 'Stop these reminders',
    signature: 'The Saloum Évasion team',
  },
} as const;

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

type ReminderInput = {
  booking: Booking;
  resumeUrl: string;
  unsubscribeUrl: string;
  /** Cause du dernier échec, s'il y en a eu un. */
  failureReason: FailureReason | null;
};

export const paymentReminderEmail = ({
  booking,
  resumeUrl,
  unsubscribeUrl,
  failureReason,
}: ReminderInput): EmailContent => {
  const copy = COPY[booking.locale];
  const source = bookingSummarySource(booking);
  const totals = summaryTotals(source);
  const failed = failureReason ? copy.failed[failureReason] : null;
  const text = [
    copy.hello(booking.traveller.firstName),
    '',
    ...(failed ? [failed] : []),
    copy.intro,
    '',
    summaryText(source),
    `${copy.total} : ${totals.total} (${totals.totalEur})`,
    '',
    `${copy.resume} : ${resumeUrl}`,
    copy.validity,
    '',
    copy.signature,
    '',
    `${copy.unsubscribe} : ${unsubscribeUrl}`,
  ].join('\n');
  const html = `<!doctype html><html lang="${booking.locale}"><body style="font-family:sans-serif;color:#0f2a24;line-height:1.5">
<p>${escapeHtml(copy.hello(booking.traveller.firstName))}</p>
${failed ? `<p><strong>${escapeHtml(failed)}</strong></p>` : ''}
<p>${escapeHtml(copy.intro)}</p>
<p>${escapeHtml(copy.total)} : <strong>${escapeHtml(totals.total)}</strong> (${escapeHtml(totals.totalEur)})</p>
<p><a href="${escapeHtml(resumeUrl)}" style="display:inline-block;padding:12px 20px;background:#0f2a24;color:#f4eee3;border-radius:6px;text-decoration:none">${escapeHtml(copy.resume)}</a></p>
<p>${escapeHtml(copy.validity)}</p>
<p>${escapeHtml(copy.signature)}</p>
<p style="font-size:14px"><a href="${escapeHtml(unsubscribeUrl)}">${escapeHtml(copy.unsubscribe)}</a></p>
</body></html>`;
  return { subject: copy.subject, text, html };
};

/**
 * Modèle WhatsApp `payment_failed_reminder` : {{1}} prénom, {{2}} lien de reprise,
 * {{3}} lien de désinscription.
 */
export const paymentReminderWhatsApp = ({
  booking,
  resumeUrl,
  unsubscribeUrl,
}: ReminderInput): WhatsAppTemplate => ({
  name: 'payment_failed_reminder',
  locale: booking.locale,
  params: [booking.traveller.firstName, resumeUrl, unsubscribeUrl],
});
