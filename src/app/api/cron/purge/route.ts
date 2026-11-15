import { timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { purgeExpiredData } from '@/jobs/purgeRequests';
import { getPayloadClient } from '@/lib/cms/queries';

// Tâche planifiée quotidienne (vercel.json) : purge des données expirées.
// Protégée par CRON_SECRET (en-tête `Authorization: Bearer …` envoyé par le planificateur).

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
  const result = await purgeExpiredData(await getPayloadClient());
  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
};
