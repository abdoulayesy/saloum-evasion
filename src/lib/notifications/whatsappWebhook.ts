import { createHmac, timingSafeEqual } from 'node:crypto';

// Webhook WhatsApp Cloud (002, T064) : signature `X-Hub-Signature-256` (HMAC-SHA256 du corps brut
// avec le secret de l'application) et extraction des statuts de livraison. Module pur.

export const verifyMetaSignature = (
  rawBody: string,
  header: string | null,
  appSecret: string,
): boolean => {
  if (!header?.startsWith('sha256=')) return false;
  const expected = Buffer.from(
    `sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`,
  );
  const received = Buffer.from(header);
  return expected.length === received.length && timingSafeEqual(expected, received);
};

export type DeliveryStatus = {
  messageId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  error?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const STATUSES: ReadonlySet<string> = new Set(['sent', 'delivered', 'read', 'failed']);

const isStatus = (value: unknown): value is DeliveryStatus['status'] =>
  typeof value === 'string' && STATUSES.has(value);

/** Statuts de livraison contenus dans une notification du webhook. */
export const deliveryStatuses = (body: unknown): DeliveryStatus[] => {
  if (!isRecord(body) || !Array.isArray(body.entry)) return [];
  return body.entry.flatMap((entry) =>
    isRecord(entry) && Array.isArray(entry.changes)
      ? entry.changes.flatMap((change) => {
          const value = isRecord(change) && isRecord(change.value) ? change.value : null;
          if (!value || !Array.isArray(value.statuses)) return [];
          return value.statuses.flatMap((item) => {
            if (!isRecord(item) || typeof item.id !== 'string' || !isStatus(item.status)) return [];
            const errors = Array.isArray(item.errors) ? item.errors : [];
            const first: unknown = errors[0];
            const error =
              isRecord(first) && typeof first.title === 'string' ? first.title : undefined;
            return [{ messageId: item.id, status: item.status, error }];
          });
        })
      : [],
  );
};
