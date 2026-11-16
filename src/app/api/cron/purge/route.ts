import { NextResponse, type NextRequest } from 'next/server';
import { purgeExpiredData } from '@/jobs/purgeRequests';
import { getPayloadClient } from '@/lib/cms/queries';
import { isCronAuthorized } from '@/lib/cronAuth';

// Tâche planifiée quotidienne (vercel.json) : purge des données expirées.
// Protégée par CRON_SECRET (en-tête `Authorization: Bearer …` envoyé par le planificateur).

export const GET = async (request: NextRequest) => {
  if (!isCronAuthorized(request.headers)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const result = await purgeExpiredData(await getPayloadClient());
  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
};
