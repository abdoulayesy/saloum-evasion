import { timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { retryNotifications } from '@/jobs/retryNotifications';
import { getPayloadClient } from '@/lib/cms/queries';

// Tâche planifiée toutes les 10 minutes (vercel.json, offre Pro) : relance des notifications
// de demandes (T146). Protégée par CRON_SECRET (`Authorization: Bearer …`).

const isAuthorized = (request: NextRequest): boolean => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(request.headers.get('authorization') ?? '');
  return expected.length === received.length && timingSafeEqual(expected, received);
};

export const GET = async (request: NextRequest) => {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const result = await retryNotifications(await getPayloadClient());
  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
};
