import { NextResponse, type NextRequest } from 'next/server';
import { getPayloadClient } from '@/lib/cms/queries';
import { getPaymentGateway } from '@/lib/payments';
import { processNotification } from '@/lib/payments/notify';
import { payloadNotifyStore } from '@/lib/payments/notifyStore';

// Point d'entrée des notifications serveur de la passerelle (002, T056) : corps brut, signature
// vérifiée par l'implémentation, idempotent ; répond vite (le travail lourd part dans la file).

export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 64 * 1024;

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ gateway: string }> },
) => {
  const { gateway: id } = await params;
  const gateway = getPaymentGateway();
  if (id !== gateway.id)
    return NextResponse.json({ error: 'Passerelle inconnue' }, { status: 404 });
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES)
    return NextResponse.json({ error: 'Trop volumineux' }, { status: 413 });
  const payload = await getPayloadClient();
  const outcome = await processNotification(
    gateway,
    payloadNotifyStore(payload),
    raw,
    request.headers,
  );
  return NextResponse.json(
    { result: outcome.result },
    { status: outcome.httpStatus, headers: { 'Cache-Control': 'no-store' } },
  );
};
