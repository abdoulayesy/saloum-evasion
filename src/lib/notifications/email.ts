import { sendEmail, type EmailMessage } from '@/lib/request/email';

// Adaptateur e-mail des notifications 002 (T034) : même transport que la 001 (Resend, ou boîte
// d'envoi `EMAIL_OUTBOX_DIR` en développement et en test). Le contenu arrive déjà rendu.

export type EmailContent = { subject: string; text: string; html: string };

export type SendResult = { ok: true; providerMessageId?: string } | { ok: false; error: string };

export const sendNotificationEmail = async (
  to: string,
  content: EmailContent,
): Promise<SendResult> => {
  const message: EmailMessage = { to, ...content };
  return (await sendEmail(message))
    ? { ok: true }
    : { ok: false, error: 'Envoi e-mail impossible (Resend indisponible ou non configuré).' };
};
