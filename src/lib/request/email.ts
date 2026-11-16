import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Resend } from 'resend';

// E-mail de notification de l'équipe (T142, FR-013) : version texte et HTML, tous les champs,
// langue du visiteur, page d'origine, référence. Toujours en français (destinataire : équipe).
// Transport : Resend ; en développement et en test, `EMAIL_OUTBOX_DIR` écrit chaque message en
// JSON dans un dossier au lieu de l'envoyer.

export type RequestEmailData = {
  reference: string;
  firstName: string;
  whatsapp: string;
  email?: string;
  arrivalDate: string;
  departureDate?: string;
  adults: number;
  children: number;
  moods: readonly string[];
  budgetBand?: string;
  message?: string;
  items: readonly { kind: string; title: string; url?: string }[];
  locale: 'fr' | 'en';
  sourceUrl: string;
  adminUrl: string;
};

export type EmailMessage = { to: string; subject: string; text: string; html: string };

const KIND_LABELS: Record<string, string> = {
  stay: 'Séjour',
  experience: 'Expérience',
  accommodation: 'Hébergement',
};

const BUDGET_LABELS: Record<string, string> = {
  lt250k: 'Moins de 250 000 FCFA',
  '250k-500k': '250 000 à 500 000 FCFA',
  gt500k: 'Plus de 500 000 FCFA',
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

/** « 4 décembre 2026 » à partir de AAAA-MM-JJ. */
const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat('fr-SN', { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(`${iso}T00:00:00Z`),
  );

export const requestEmailSubject = (data: RequestEmailData): string =>
  `[Demande ${data.reference}] ${data.firstName} – ${formatDate(data.arrivalDate)} – ${data.adults}+${data.children}`;

const rows = (data: RequestEmailData): [string, string][] => [
  ['Référence', data.reference],
  ['Prénom', data.firstName],
  ['WhatsApp', data.whatsapp],
  ['E-mail', data.email ?? '—'],
  ['Arrivée', formatDate(data.arrivalDate)],
  ['Départ', data.departureDate ? formatDate(data.departureDate) : '—'],
  ['Voyageurs', `${data.adults} adulte(s), ${data.children} enfant(s)`],
  ['Envies', data.moods.length > 0 ? data.moods.join(', ') : '—'],
  ['Budget', data.budgetBand ? (BUDGET_LABELS[data.budgetBand] ?? data.budgetBand) : '—'],
  ['Langue', data.locale === 'fr' ? 'Français' : 'Anglais'],
  ['Page d’origine', data.sourceUrl],
];

export const buildRequestEmail = (data: RequestEmailData, to: string): EmailMessage => {
  const items =
    data.items.length > 0
      ? data.items.map((item) => `- ${KIND_LABELS[item.kind] ?? item.kind} : ${item.title}`)
      : ['- Aucun élément choisi (demande libre)'];
  const text = [
    `Nouvelle demande de séjour ${data.reference}`,
    '',
    ...rows(data).map(([label, value]) => `${label} : ${value}`),
    '',
    'Éléments choisis :',
    ...items,
    '',
    'Message :',
    data.message ?? '—',
    '',
    `Traiter la demande : ${data.adminUrl}`,
  ].join('\n');

  const html = `<!doctype html><html lang="fr"><body style="font-family:sans-serif;color:#0f2a24">
<h1 style="font-size:20px">Nouvelle demande de séjour ${escapeHtml(data.reference)}</h1>
<table style="border-collapse:collapse">${rows(data)
    .map(
      ([label, value]) =>
        `<tr><th style="text-align:left;padding:4px 12px 4px 0">${escapeHtml(label)}</th><td style="padding:4px 0">${escapeHtml(value)}</td></tr>`,
    )
    .join('')}</table>
<h2 style="font-size:16px">Éléments choisis</h2>
<ul>${
    data.items.length > 0
      ? data.items
          .map(
            (item) =>
              `<li>${escapeHtml(KIND_LABELS[item.kind] ?? item.kind)} : ${
                item.url
                  ? `<a href="${escapeHtml(item.url)}">${escapeHtml(item.title)}</a>`
                  : escapeHtml(item.title)
              }</li>`,
          )
          .join('')
      : '<li>Aucun élément choisi (demande libre)</li>'
  }</ul>
<h2 style="font-size:16px">Message</h2>
<p style="white-space:pre-wrap">${escapeHtml(data.message ?? '—')}</p>
<p><a href="${escapeHtml(data.adminUrl)}">Traiter la demande dans l’administration</a></p>
</body></html>`;

  return { to, subject: requestEmailSubject(data), text, html };
};

/** Envoie un message ; `true` s'il est parti (ou déposé dans la boîte d'envoi de test). */
export const sendEmail = async (message: EmailMessage): Promise<boolean> => {
  const outbox = process.env.EMAIL_OUTBOX_DIR;
  if (outbox) {
    await mkdir(outbox, { recursive: true });
    const file = join(outbox, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`);
    await writeFile(file, JSON.stringify(message, null, 2), 'utf8');
    return true;
  }
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.REQUEST_FROM_EMAIL;
  if (!apiKey || !from) return false;
  try {
    const { error } = await new Resend(apiKey).emails.send({
      from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    return !error;
  } catch {
    return false;
  }
};
