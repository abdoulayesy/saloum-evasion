import { NextResponse, type NextRequest } from 'next/server';
import type { Payload } from 'payload';
import { runAvailabilitySlaCheck } from '@/jobs/availabilitySlaAlert';
import { runAbandonedCartReminders } from '@/jobs/abandonedCartReminder';
import { runBalanceReminders } from '@/jobs/balanceReminder';
import { runPaymentReconciliation } from '@/jobs/reconcilePendingPayments';
import { runRefundDeadlineAlert } from '@/jobs/refundDeadlineAlert';
import { runUnavailableAutoRefund } from '@/jobs/unavailableAutoRefund';
import { getPayloadClient } from '@/lib/cms/queries';
import { isCronAuthorized } from '@/lib/cronAuth';
import { checkoutEnv } from '@/lib/env';

// Exécution de la file de tâches Payload (002, T028) : appelée chaque minute par Vercel Cron
// (offre Pro) et par `pnpm jobs:dev` en local. Protégée par CRON_SECRET.

export const dynamic = 'force-dynamic';

const BATCH_SIZE = 50;

/**
 * Date de référence des relances. `?now=` (ISO) n'est accepté qu'avec la passerelle factice
 * (tests de bout en bout : déclencher une échéance sans attendre des heures ou des semaines).
 */
const referenceDate = (request: NextRequest): Date => {
  const requested = request.nextUrl.searchParams.get('now');
  if (!requested || checkoutEnv().PAYMENT_GATEWAY !== 'fake') return new Date();
  const parsed = new Date(requested);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

type QueueRun = Awaited<ReturnType<Payload['jobs']['run']>>;

let running: Promise<QueueRun> | null = null;

/**
 * Une seule exécution de la file à la fois par processus : deux `jobs.run` simultanés peuvent
 * prendre la même tâche, et l'un trouve alors son journal à `null` (erreur 500). Un appel
 * concurrent attend l'exécution en cours au lieu d'en lancer une seconde.
 */
const runQueueOnce = (payload: Payload): Promise<QueueRun> => {
  if (running) return running;
  const run = async (): Promise<QueueRun> => await payload.jobs.run({ limit: BATCH_SIZE });
  const current = run().finally(() => {
    running = null;
  });
  running = current;
  return current;
};

const CHECK_INTERVAL_MS = 20_000;
const lastChecks = new Map<string, number>();

/**
 * Contrôles périodiques au plus toutes les 20 s par processus : le planificateur appelle la
 * route chaque minute, mais des appels rapprochés (relances manuelles, tests) répéteraient sinon
 * des dizaines de requêtes inutiles et satureraient la base. La file, elle, part à chaque appel.
 */
const atMostEvery = async (key: string, check: () => Promise<void>): Promise<void> => {
  const last = lastChecks.get(key) ?? 0;
  if (Date.now() - last < CHECK_INTERVAL_MS) return;
  lastChecks.set(key, Date.now());
  await check();
};

export const GET = async (request: NextRequest) => {
  if (!isCronAuthorized(request.headers)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const payload = await getPayloadClient();
  // Contrôles périodiques légers avant la file, toujours à l'heure réelle : échéance de
  // confirmation de disponibilité (T063), réconciliation des paiements en attente (T077),
  // remboursements validés non versés à J+10 (T088), prestations indisponibles sans choix à
  // 48 h (T089).
  // Relances (solde T071, paniers abandonnés T078) : date de référence.
  await atMostEvery('realtime', async () => {
    await runAvailabilitySlaCheck(payload);
    await runPaymentReconciliation(payload);
    await runRefundDeadlineAlert(payload);
    await runUnavailableAutoRefund(payload);
  });
  const now = referenceDate(request);
  const reminders = async () => {
    await runBalanceReminders(payload, now);
    await runAbandonedCartReminders(payload, now);
  };
  // Date de référence explicite (tests) : toujours exécutées ; sinon au même rythme que le reste.
  if (request.nextUrl.searchParams.has('now')) await reminders();
  else await atMostEvery('reminders', reminders);
  const result = await runQueueOnce(payload);
  return NextResponse.json(
    { ran: Object.keys(result.jobStatus ?? {}).length, remaining: result.remainingJobsFromQueried },
    { headers: { 'Cache-Control': 'no-store' } },
  );
};
