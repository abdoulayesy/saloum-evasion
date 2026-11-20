import { NextResponse, type NextRequest } from 'next/server';
import { runCompleteBookings } from '@/jobs/completeBookings';
import { runPurgeCarts } from '@/jobs/purgeCarts';
import { purgeExpiredData } from '@/jobs/purgeRequests';
import { getPayloadClient } from '@/lib/cms/queries';
import { isCronAuthorized } from '@/lib/cronAuth';

// Tâche planifiée quotidienne (vercel.json, 3 h) : purge des données expirées (demandes de la 001 ;
// paniers et réservations impayés à 30 jours, 002 T100) et passage `completed` des réservations
// dont la dernière prestation est passée (002 T100).
// Protégée par CRON_SECRET (en-tête `Authorization: Bearer …` envoyé par le planificateur).

export const GET = async (request: NextRequest) => {
  if (!isCronAuthorized(request.headers)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const payload = await getPayloadClient();
  const requests = await purgeExpiredData(payload);
  const carts = await runPurgeCarts(payload);
  const completedBookings = await runCompleteBookings(payload);
  return NextResponse.json(
    { ...requests, ...carts, completedBookings },
    { headers: { 'Cache-Control': 'no-store' } },
  );
};
