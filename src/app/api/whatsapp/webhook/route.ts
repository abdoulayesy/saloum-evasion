import { NextResponse, type NextRequest } from 'next/server';
import { getPayloadClient } from '@/lib/cms/queries';
import { checkoutEnv } from '@/lib/env';
import { deliveryStatuses, verifyMetaSignature } from '@/lib/notifications/whatsappWebhook';

// Webhook WhatsApp Cloud (002, T064) : vérification par Meta (GET, jeton de vérification) et
// statuts de livraison (POST signé) reportés dans le journal `notifications`.

export const dynamic = 'force-dynamic';

export const GET = (request: NextRequest) => {
  const params = request.nextUrl.searchParams;
  const { WHATSAPP_VERIFY_TOKEN } = checkoutEnv();
  if (
    WHATSAPP_VERIFY_TOKEN &&
    params.get('hub.mode') === 'subscribe' &&
    params.get('hub.verify_token') === WHATSAPP_VERIFY_TOKEN
  ) {
    return new Response(params.get('hub.challenge') ?? '', { status: 200 });
  }
  return new Response('Interdit', { status: 403 });
};

export const POST = async (request: NextRequest) => {
  const { WHATSAPP_APP_SECRET } = checkoutEnv();
  const raw = await request.text();
  if (
    !WHATSAPP_APP_SECRET ||
    !verifyMetaSignature(raw, request.headers.get('x-hub-signature-256'), WHATSAPP_APP_SECRET)
  ) {
    return new Response('Signature invalide', { status: 401 });
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response('Corps invalide', { status: 400 });
  }
  const payload = await getPayloadClient();
  for (const status of deliveryStatuses(body)) {
    if (status.status !== 'failed') continue;
    const { docs } = await payload.find({
      collection: 'notifications',
      where: { providerMessageId: { equals: status.messageId } },
      limit: 1,
      depth: 0,
    });
    const notification = docs[0];
    if (notification) {
      await payload.update({
        collection: 'notifications',
        id: notification.id,
        data: { status: 'failed', lastError: status.error ?? 'Échec de remise WhatsApp' },
      });
    }
  }
  return NextResponse.json({ ok: true });
};
