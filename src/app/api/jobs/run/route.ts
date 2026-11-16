import { NextResponse, type NextRequest } from 'next/server';
import { getPayloadClient } from '@/lib/cms/queries';
import { isCronAuthorized } from '@/lib/cronAuth';

// Exécution de la file de tâches Payload (002, T028) : appelée chaque minute par Vercel Cron
// (offre Pro) et par `pnpm jobs:dev` en local. Protégée par CRON_SECRET.

export const dynamic = 'force-dynamic';

const BATCH_SIZE = 50;

export const GET = async (request: NextRequest) => {
  if (!isCronAuthorized(request.headers)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const payload = await getPayloadClient();
  const result = await payload.jobs.run({ limit: BATCH_SIZE });
  return NextResponse.json(
    { ran: Object.keys(result.jobStatus ?? {}).length, remaining: result.remainingJobsFromQueried },
    { headers: { 'Cache-Control': 'no-store' } },
  );
};
