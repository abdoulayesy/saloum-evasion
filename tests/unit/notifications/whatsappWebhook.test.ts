import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { deliveryStatuses, verifyMetaSignature } from '@/lib/notifications/whatsappWebhook';

// T064 : signature X-Hub-Signature-256 et statuts de livraison du webhook WhatsApp Cloud.
describe('webhook WhatsApp', () => {
  const secret = 'app-secret';
  const body = JSON.stringify({
    entry: [
      {
        changes: [
          {
            value: {
              statuses: [
                { id: 'wamid.1', status: 'delivered' },
                { id: 'wamid.2', status: 'failed', errors: [{ title: 'Re-engagement message' }] },
                { id: 'wamid.3', status: 'inconnu' },
              ],
            },
          },
        ],
      },
    ],
  });
  const signature = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;

  it('signature valide acceptée, altérée ou absente refusée', () => {
    expect(verifyMetaSignature(body, signature, secret)).toBe(true);
    expect(verifyMetaSignature(`${body} `, signature, secret)).toBe(false);
    expect(verifyMetaSignature(body, null, secret)).toBe(false);
    expect(verifyMetaSignature(body, 'sha1=abc', secret)).toBe(false);
  });

  it('statuts reconnus extraits, inconnus ignorés', () => {
    expect(deliveryStatuses(JSON.parse(body))).toEqual([
      { messageId: 'wamid.1', status: 'delivered', error: undefined },
      { messageId: 'wamid.2', status: 'failed', error: 'Re-engagement message' },
    ]);
    expect(deliveryStatuses({})).toEqual([]);
  });
});
