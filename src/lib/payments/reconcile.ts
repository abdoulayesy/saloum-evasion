import type { PaymentGateway } from './gateway';
import {
  applyGatewayStatus,
  type NotifyPayment,
  type NotifyResult,
  type StatusStore,
} from './notify';

// Réconciliation des paiements en attente (002, US3, T077 ; research R3, FR-019, FR-020) : une
// notification peut se perdre. Toute tentative `initiated` ou `pending` sans nouvelle depuis
// 10 min est interrogée auprès de la passerelle toutes les 5 min, pendant 24 h au plus. Une
// réponse définitive suit les mêmes transitions que les notifications (`applyGatewayStatus`) ;
// sans réponse définitive à 30 min, la tentative passe à `expired` (un nouveau paiement devient
// possible). Logique indépendante du stockage, testée en mémoire (T075).

export const RECONCILE_FIRST_CHECK_MINUTES = 10;
export const RECONCILE_INTERVAL_MINUTES = 5;
export const RECONCILE_EXPIRY_MINUTES = 30;
export const RECONCILE_WINDOW_HOURS = 24;

const MINUTE_MS = 60_000;

export type ReconcileCandidate = NotifyPayment & {
  createdAt: string;
  /** Dernière écriture : sert de date de la dernière interrogation (`touch`). */
  updatedAt: string;
};

export type ReconcileStore = StatusStore & {
  /** Tentatives à interroger maintenant (voir `needsReconciliation`). */
  listCandidates: (now: Date) => Promise<ReconcileCandidate[]>;
  /** Note l'interrogation (met à jour `updatedAt`) sans changer le statut. */
  touch: (id: number) => Promise<void>;
};

export type ReconcileResult = NotifyResult | 'unreachable';

const ageMinutes = (iso: string, now: Date): number =>
  (now.getTime() - new Date(iso).getTime()) / MINUTE_MS;

/** La tentative doit-elle être interrogée maintenant ? */
export const needsReconciliation = (payment: ReconcileCandidate, now: Date): boolean => {
  if (payment.status !== 'initiated' && payment.status !== 'pending') return false;
  const age = ageMinutes(payment.createdAt, now);
  return (
    age >= RECONCILE_FIRST_CHECK_MINUTES &&
    age <= RECONCILE_WINDOW_HOURS * 60 &&
    ageMinutes(payment.updatedAt, now) >= RECONCILE_INTERVAL_MINUTES
  );
};

const reconcileOne = async (
  gateway: Pick<PaymentGateway, 'getStatus'>,
  store: ReconcileStore,
  payment: ReconcileCandidate,
  now: Date,
): Promise<ReconcileResult> => {
  const expiredByTime = ageMinutes(payment.createdAt, now) >= RECONCILE_EXPIRY_MINUTES;
  if (!payment.gatewayReference) {
    // Jamais redirigée vers la passerelle : rien à lui demander.
    if (expiredByTime) return applyGatewayStatus(store, payment, { status: 'expired' });
    await store.touch(payment.id);
    return 'pending';
  }
  const status = await gateway.getStatus(payment.gatewayReference).catch(() => null);
  if (status === null) {
    await store.touch(payment.id);
    return 'unreachable';
  }
  if (status.status === 'pending') {
    if (expiredByTime) return applyGatewayStatus(store, payment, { status: 'expired' });
    await store.touch(payment.id);
    return 'pending';
  }
  return applyGatewayStatus(store, payment, status);
};

/** Interroge la passerelle pour chaque tentative en attente ; résultat par identifiant. */
export const reconcilePayments = async (
  gateway: Pick<PaymentGateway, 'getStatus'>,
  store: ReconcileStore,
  now: Date = new Date(),
): Promise<Record<number, ReconcileResult>> => {
  const results: Record<number, ReconcileResult> = {};
  for (const payment of await store.listCandidates(now)) {
    results[payment.id] = await reconcileOne(gateway, store, payment, now);
  }
  return results;
};
