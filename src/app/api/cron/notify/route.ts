import { NextResponse, type NextRequest } from 'next/server';
import { retryNotifications } from '@/jobs/retryNotifications';
import { getPayloadClient } from '@/lib/cms/queries';
import { isCronAuthorized } from '@/lib/cronAuth';

// Tâche planifiée toutes les 10 minutes (vercel.json, offre Pro) : relance des notifications
// de demandes (T146). Protégée par CRON_SECRET (`Authorization: Bearer …`).

export const GET = async (request: NextRequest) => {
  if (!isCronAuthorized(request.headers)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const result = await retryNotifications(await getPayloadClient());
  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
};
