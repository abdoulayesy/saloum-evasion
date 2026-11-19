import { formatXof } from '@/lib/pricing';
import type { Booking } from '@/payload-types';
import type { EmailContent } from '../email';
import type { WhatsAppTemplate } from '../whatsapp';

// Annulation et remboursement (002, US4, T088 ; contrat notifications) :
// - `cancellation_received` : accusé de la demande, montant remboursable et délai annoncé ;
// - `refund_status` : chaque changement de statut (validé, versé, refusé avec motif) ;
// - `manage_link` : « Retrouver ma réservation » (e-mail seulement) ;
// - équipe : demande d'annulation reçue, remboursement validé non versé à J+10 (en français).

type Locale = Booking['locale'];
export type TravellerRefundStatus = 'approved' | 'paid' | 'rejected';

const COPY = {
  fr: {
    hello: (name: string) => `Bonjour ${name},`,
    receivedSubject: (reference: string) => `Demande d’annulation reçue — ${reference}`,
    received: (amount: string) =>
      `Nous avons bien reçu votre demande d’annulation. Montant remboursable selon les conditions acceptées : ${amount}. Notre équipe la valide sous 2 jours ouvrés ; le remboursement est ensuite versé sur votre moyen de paiement d’origine dans les 14 jours.`,
    statusSubject: (reference: string) => `Votre remboursement — ${reference}`,
    status: {
      approved: (amount: string) =>
        `Votre remboursement de ${amount} est validé. Il sera versé sur votre moyen de paiement d’origine dans les 14 jours.`,
      paid: (amount: string) => `Votre remboursement de ${amount} a été versé.`,
      rejected: () => 'Votre demande de remboursement n’a pas pu être acceptée.',
    },
    statusLabel: { approved: 'validé', paid: 'versé', rejected: 'refusé' },
    reason: 'Motif',
    manageSubject: (reference: string) => `Votre lien de réservation — ${reference}`,
    manageIntro:
      'Voici le lien personnel de votre réservation : consultez-la, téléchargez votre bon, payez le solde ou demandez une annulation.',
    manageIgnore: 'Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.',
    manage: 'Voir ma réservation',
    signature: 'L’équipe Saloum Évasion',
  },
  en: {
    hello: (name: string) => `Hello ${name},`,
    receivedSubject: (reference: string) => `Cancellation request received — ${reference}`,
    received: (amount: string) =>
      `We have received your cancellation request. Refundable amount under the accepted terms: ${amount}. Our team approves it within 2 working days; the refund is then paid to your original payment method within 14 days.`,
    statusSubject: (reference: string) => `Your refund — ${reference}`,
    status: {
      approved: (amount: string) =>
        `Your refund of ${amount} is approved. It will be paid to your original payment method within 14 days.`,
      paid: (amount: string) => `Your refund of ${amount} has been paid.`,
      rejected: () => 'Your refund request could not be accepted.',
    },
    statusLabel: { approved: 'approved', paid: 'paid', rejected: 'declined' },
    reason: 'Reason',
    manageSubject: (reference: string) => `Your booking link — ${reference}`,
    manageIntro:
      'Here is the personal link to your booking: view it, download your voucher, pay the balance or request a cancellation.',
    manageIgnore: 'If you did not make this request, please ignore this message.',
    manage: 'View my booking',
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

const render = (
  locale: Locale,
  subject: string,
  paragraphs: readonly string[],
  link: { href: string; label: string } | null,
): EmailContent => {
  const text = [...paragraphs, ...(link ? [`${link.label} : ${link.href}`] : [])].join('\n\n');
  const html = `<!doctype html><html lang="${locale}"><body style="font-family:sans-serif;color:#0f2a24;line-height:1.5">
${paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('\n')}
${link ? `<p><a href="${escapeHtml(link.href)}" style="display:inline-block;padding:12px 20px;background:#0f2a24;color:#f4eee3;border-radius:6px;text-decoration:none">${escapeHtml(link.label)}</a></p>` : ''}
</body></html>`;
  return { subject, text, html };
};

export const cancellationReceivedEmail = (
  booking: Booking,
  amount: number,
  manageUrl: string,
): EmailContent => {
  const copy = COPY[booking.locale];
  return render(
    booking.locale,
    copy.receivedSubject(booking.reference),
    [copy.hello(booking.traveller.firstName), copy.received(formatXof(amount)), copy.signature],
    { href: manageUrl, label: copy.manage },
  );
};

/** Modèle WhatsApp `cancellation_received` : {{1}} prénom, {{2}} référence, {{3}} montant, {{4}} lien. */
export const cancellationReceivedWhatsApp = (
  booking: Booking,
  amount: number,
  manageUrl: string,
): WhatsAppTemplate => ({
  name: 'cancellation_received',
  locale: booking.locale,
  params: [booking.traveller.firstName, booking.reference, formatXof(amount), manageUrl],
});

export const refundStatusEmail = (
  booking: Booking,
  {
    status,
    amount,
    rejectionReason,
  }: { status: TravellerRefundStatus; amount: number; rejectionReason?: string | null },
  manageUrl: string,
): EmailContent => {
  const copy = COPY[booking.locale];
  return render(
    booking.locale,
    copy.statusSubject(booking.reference),
    [
      copy.hello(booking.traveller.firstName),
      copy.status[status](formatXof(amount)),
      ...(status === 'rejected' && rejectionReason ? [`${copy.reason} : ${rejectionReason}`] : []),
      copy.signature,
    ],
    { href: manageUrl, label: copy.manage },
  );
};

/**
 * Modèle WhatsApp `refund_status` : {{1}} prénom, {{2}} référence, {{3}} statut, {{4}} montant,
 * {{5}} lien de gestion.
 */
export const refundStatusWhatsApp = (
  booking: Booking,
  { status, amount }: { status: TravellerRefundStatus; amount: number },
  manageUrl: string,
): WhatsAppTemplate => ({
  name: 'refund_status',
  locale: booking.locale,
  params: [
    booking.traveller.firstName,
    booking.reference,
    COPY[booking.locale].statusLabel[status],
    formatXof(amount),
    manageUrl,
  ],
});

export const manageLinkEmail = (booking: Booking, manageUrl: string): EmailContent => {
  const copy = COPY[booking.locale];
  return render(
    booking.locale,
    copy.manageSubject(booking.reference),
    [copy.hello(booking.traveller.firstName), copy.manageIntro, copy.manageIgnore, copy.signature],
    { href: manageUrl, label: copy.manage },
  );
};

/** Équipe (finance) : demande d'annulation à traiter. */
export const teamCancellationEmail = (
  booking: Booking,
  amount: number,
  adminUrl: string,
): EmailContent =>
  render(
    'fr',
    `[Annulation demandée] ${booking.reference}`,
    [
      `Demande d’annulation de ${booking.traveller.firstName} ${booking.traveller.lastName} pour ${booking.reference}.`,
      `Montant remboursable calculé (paliers acceptés) : ${formatXof(amount)}.`,
      'À valider puis verser sur le moyen d’origine dans les 14 jours.',
    ],
    { href: adminUrl, label: 'Ouvrir le remboursement dans l’admin' },
  );

/** Équipe (finance) : remboursement validé et toujours pas versé à J+10. */
export const teamRefundOverdueEmail = (
  booking: Booking,
  amount: number,
  deadline: string,
  adminUrl: string,
): EmailContent =>
  render(
    'fr',
    `[Remboursement en retard] ${booking.reference}`,
    [
      `Le remboursement de ${formatXof(amount)} pour ${booking.reference} est validé depuis 10 jours et n’est pas versé.`,
      `Date limite de versement : ${deadline}.`,
    ],
    { href: adminUrl, label: 'Ouvrir le remboursement dans l’admin' },
  );
