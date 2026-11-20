import type { Payload } from 'payload';
import { getPaymentGateway } from '@/lib/payments';
import { payloadNotifyStore } from '@/lib/payments/notifyStore';
import {
  RECONCILE_FIRST_CHECK_MINUTES,
  RECONCILE_INTERVAL_MINUTES,
  RECONCILE_WINDOW_HOURS,
  reconcilePayments,
  type ReconcileStore,
} from '@/lib/payments/reconcile';

// Réconciliation des paiements en attente (002, US3, T077) : stockage Payload de
// `reconcilePayments`. Exécutée à chaque passage de /api/jobs/run ; la fenêtre de 10 min, le
// rythme de 5 min et la limite de 24 h sont portés par la requête (dates de création et de
// dernière écriture), sans champ supplémentaire.

const BATCH = 50;
const MINUTE_MS = 60_000;

const minutesBefore = (now: Date, minutes: number): string =>
  new Date(now.getTime() - minutes * MINUTE_MS).toISOString();

const payloadReconcileStore = (payload: Payload): ReconcileStore => {
  const { recordEvent, updatePayment, onSucceeded, alertAnomaly } = payloadNotifyStore(payload);
  return {
    recordEvent,
    updatePayment,
    onSucceeded,
    alertAnomaly,
    listCandidates: async (now) => {
      const { docs } = await payload.find({
        collection: 'payments',
        where: {
          and: [
            { status: { in: ['initiated', 'pending'] } },
            { createdAt: { less_than_equal: minutesBefore(now, RECONCILE_FIRST_CHECK_MINUTES) } },
            { createdAt: { greater_than_equal: minutesBefore(now, RECONCILE_WINDOW_HOURS * 60) } },
            { updatedAt: { less_than_equal: minutesBefore(now, RECONCILE_INTERVAL_MINUTES) } },
          ],
        },
        sort: 'createdAt',
        limit: BATCH,
        depth: 0,
      });
      return docs.map((doc) => ({
        id: doc.id,
        status: doc.status,
        amount: doc.amount,
        currency: doc.currency,
        gatewayReference: doc.gatewayReference,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }));
    },
    touch: async (id) => {
      const current = await payload.findByID({ collection: 'payments', id, depth: 0 });
      await payload.update({ collection: 'payments', id, data: { status: current.status } });
    },
  };
};

export const runPaymentReconciliation = async (
  payload: Payload,
  now: Date = new Date(),
): Promise<number> => {
  const results = await reconcilePayments(getPaymentGateway(), payloadReconcileStore(payload), now);
  return Object.keys(results).length;
};
