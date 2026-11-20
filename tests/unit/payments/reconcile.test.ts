import { describe, expect, it } from 'vitest';
import type { GatewayPaymentStatus } from '@/lib/payments/gateway';
import {
  needsReconciliation,
  reconcilePayments,
  type ReconcileCandidate,
  type ReconcileStore,
} from '@/lib/payments/reconcile';

// T075 (US3, FR-019, FR-020 ; research R3) : une tentative sans nouvelle depuis 10 min est
// interrogée auprès de la passerelle toutes les 5 min, pendant 24 h au plus ; à 30 min sans
// réponse définitive, elle passe à `expired`. Mêmes transitions que les notifications : succès
// appliqué une seule fois, jamais de double transition.

const NOW = new Date('2027-01-10T12:00:00Z');
const minutesAgo = (minutes: number): string =>
  new Date(NOW.getTime() - minutes * 60_000).toISOString();

const candidate = (overrides: Partial<ReconcileCandidate> = {}): ReconcileCandidate => ({
  id: 1,
  status: 'pending',
  amount: 150_000,
  currency: 'XOF',
  gatewayReference: 'ref-1',
  createdAt: minutesAgo(12),
  updatedAt: minutesAgo(12),
  ...overrides,
});

const harness = (
  payments: ReconcileCandidate[],
  statuses: Record<string, GatewayPaymentStatus>,
) => {
  const queried: string[] = [];
  const touched: number[] = [];
  const calls = { queried, succeeded: 0, touched, anomalies: 0 };
  const gateway = {
    getStatus: async (reference: string): Promise<GatewayPaymentStatus> => {
      calls.queried.push(reference);
      return statuses[reference] ?? { status: 'pending' };
    },
  };
  const store: ReconcileStore = {
    listCandidates: async () => payments.filter((payment) => needsReconciliation(payment, NOW)),
    touch: async (id) => {
      calls.touched.push(id);
    },
    updatePayment: async (id, data) => {
      const payment = payments.find((candidate) => candidate.id === id);
      if (payment) Object.assign(payment, data);
    },
    onSucceeded: async () => {
      calls.succeeded += 1;
    },
    alertAnomaly: async () => {
      calls.anomalies += 1;
    },
  };
  return { gateway, store, calls };
};

describe('réconciliation des paiements en attente', () => {
  it('fenêtre : à partir de 10 min, toutes les 5 min, pendant 24 h', () => {
    expect(
      needsReconciliation(candidate({ createdAt: minutesAgo(9), updatedAt: minutesAgo(9) }), NOW),
    ).toBe(false);
    expect(needsReconciliation(candidate(), NOW)).toBe(true);
    // Interrogée il y a 3 min : on attend le prochain créneau de 5 min.
    expect(needsReconciliation(candidate({ updatedAt: minutesAgo(3) }), NOW)).toBe(false);
    expect(needsReconciliation(candidate({ updatedAt: minutesAgo(5) }), NOW)).toBe(true);
    expect(needsReconciliation(candidate({ createdAt: minutesAgo(24 * 60 + 1) }), NOW)).toBe(false);
    expect(needsReconciliation(candidate({ status: 'succeeded' }), NOW)).toBe(false);
    expect(needsReconciliation(candidate({ status: 'failed' }), NOW)).toBe(false);
  });

  it('toujours en attente avant 30 min : rien ne change, prochaine interrogation dans 5 min', async () => {
    const payment = candidate();
    const { gateway, store, calls } = harness([payment], {});
    expect(await reconcilePayments(gateway, store, NOW)).toEqual({ 1: 'pending' });
    expect(payment.status).toBe('pending');
    expect(calls.touched).toEqual([1]);
  });

  it('sans réponse définitive à 30 min : `expired`', async () => {
    const payment = candidate({ createdAt: minutesAgo(31), updatedAt: minutesAgo(6) });
    const { gateway, store } = harness([payment], {});
    expect(await reconcilePayments(gateway, store, NOW)).toEqual({ 1: 'expired' });
    expect(payment.status).toBe('expired');
  });

  it('tentative jamais redirigée (sans référence) : `expired` à 30 min, sans appel', async () => {
    const payment = candidate({
      status: 'initiated',
      gatewayReference: null,
      createdAt: minutesAgo(30),
      updatedAt: minutesAgo(30),
    });
    const { gateway, store, calls } = harness([payment], {});
    await reconcilePayments(gateway, store, NOW);
    expect(payment.status).toBe('expired');
    expect(calls.queried).toEqual([]);
  });

  it('succès connu de la passerelle : réservation déclenchée une seule fois', async () => {
    const payment = candidate();
    const paid: GatewayPaymentStatus = { status: 'succeeded', amountXof: 150_000, paidAt: NOW };
    const { gateway, store, calls } = harness([payment], { 'ref-1': paid });
    expect(await reconcilePayments(gateway, store, NOW)).toEqual({ 1: 'succeeded' });
    expect(calls.succeeded).toBe(1);
    // Passage suivant : la tentative n'est plus candidate, aucune double transition.
    expect(await reconcilePayments(gateway, store, NOW)).toEqual({});
    expect(calls.succeeded).toBe(1);
  });

  it('échec connu de la passerelle : cause conservée', async () => {
    const payment = candidate();
    const { gateway, store } = harness([payment], {
      'ref-1': { status: 'failed', reason: 'insufficient_funds' },
    });
    await reconcilePayments(gateway, store, NOW);
    expect(payment).toMatchObject({ status: 'failed', failureReason: 'insufficient_funds' });
  });

  it('montant divergent : anomalie, pas de réservation', async () => {
    const payment = candidate();
    const { gateway, store, calls } = harness([payment], {
      'ref-1': { status: 'succeeded', amountXof: 1_000, paidAt: NOW },
    });
    expect(await reconcilePayments(gateway, store, NOW)).toEqual({ 1: 'anomaly' });
    expect(calls).toMatchObject({ succeeded: 0, anomalies: 1 });
  });

  it('passerelle injoignable : la tentative reste en attente et sera réinterrogée', async () => {
    const payment = candidate();
    const { store, calls } = harness([payment], {});
    const broken = {
      getStatus: async (): Promise<GatewayPaymentStatus> => {
        throw new Error('timeout');
      },
    };
    expect(await reconcilePayments(broken, store, NOW)).toEqual({ 1: 'unreachable' });
    expect(payment.status).toBe('pending');
    expect(calls.touched).toEqual([1]);
  });
});
