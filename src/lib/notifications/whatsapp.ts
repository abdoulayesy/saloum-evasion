import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { checkoutEnv } from '@/lib/env';
import type { SendResult } from './email';

// Adaptateur WhatsApp (002, T034 ; décision D-T12) : API WhatsApp Cloud de Meta appelée en
// `fetch`, messages modèles approuvés. Sans `WHATSAPP_CLOUD_TOKEN`, le message est seulement
// journalisé (et déposé dans `EMAIL_OUTBOX_DIR` en test) : le site ne tombe jamais pour WhatsApp.

const GRAPH_API = 'https://graph.facebook.com/v21.0';

export type WhatsAppTemplate = {
  /** Nom du modèle approuvé chez Meta (ex. `booking_confirmed`). */
  name: string;
  locale: 'fr' | 'en';
  /** Variables {{1}}, {{2}}… du corps, dans l'ordre. */
  params: readonly string[];
};

/** Corps de requête de l'API Cloud pour un message modèle. */
export const templateRequestBody = (toE164: string, template: WhatsAppTemplate) => ({
  messaging_product: 'whatsapp',
  to: toE164.replace(/^\+/, ''),
  type: 'template',
  template: {
    name: template.name,
    language: { code: template.locale === 'fr' ? 'fr' : 'en' },
    components: [
      {
        type: 'body',
        parameters: template.params.map((text) => ({ type: 'text', text })),
      },
    ],
  },
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const messageIdOf = (json: unknown): string | undefined => {
  if (!isRecord(json) || !Array.isArray(json.messages)) return undefined;
  const [first] = json.messages;
  return isRecord(first) && typeof first.id === 'string' ? first.id : undefined;
};

const logOnly = async (toE164: string, template: WhatsAppTemplate): Promise<SendResult> => {
  const outbox = process.env.EMAIL_OUTBOX_DIR;
  if (outbox) {
    await mkdir(outbox, { recursive: true });
    const file = join(
      outbox,
      `whatsapp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`,
    );
    await writeFile(file, JSON.stringify({ to: toE164, template }, null, 2), 'utf8');
  } else {
    console.info(`[whatsapp] (journal seul) ${template.name} → ${toE164.slice(0, 4)}***`);
  }
  return { ok: true, providerMessageId: 'logged' };
};

export const sendWhatsAppTemplate = async (
  toE164: string,
  template: WhatsAppTemplate,
): Promise<SendResult> => {
  const { WHATSAPP_CLOUD_TOKEN: token, WHATSAPP_PHONE_NUMBER_ID: phoneId } = checkoutEnv();
  if (!token || !phoneId) return logOnly(toE164, template);
  try {
    const response = await fetch(`${GRAPH_API}/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(templateRequestBody(toE164, template)),
      signal: AbortSignal.timeout(10_000),
    });
    const json: unknown = await response.json().catch(() => null);
    if (!response.ok) return { ok: false, error: `WhatsApp HTTP ${response.status}` };
    return { ok: true, providerMessageId: messageIdOf(json) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'WhatsApp injoignable' };
  }
};
