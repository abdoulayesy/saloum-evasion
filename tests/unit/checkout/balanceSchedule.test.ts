import { describe, expect, it } from 'vitest';
import { balanceReminderSteps, dueBalanceReminder } from '@/lib/checkout/balanceSchedule';

// T067 (US2, FR-017) : lien du solde envoyé 7 jours avant la date limite (J-21) puis la veille
// (J-15) ; à la date limite, alerte de l'équipe et dernier rappel au voyageur ; rien si le solde
// est payé ou la réservation annulée ; jamais deux fois la même relance.

const DUE = '2027-03-01'; // arrivée le 2027-03-15, solde exigible à J-14

const booking = {
  status: 'deposit_paid' as const,
  paymentPlan: 'deposit' as const,
  balanceDueDate: DUE,
};

describe('planificateur des rappels du solde', () => {
  it('trois étapes : J-21, J-15 (veille de la date limite), date limite', () => {
    expect(balanceReminderSteps(DUE)).toEqual([
      { kind: 'balance_due', rank: 1, scheduledFor: '2027-02-22' },
      { kind: 'balance_due', rank: 2, scheduledFor: '2027-02-28' },
      { kind: 'balance_overdue', rank: 1, scheduledFor: '2027-03-01' },
    ]);
  });

  it('rien avant J-21', () => {
    expect(dueBalanceReminder({ ...booking, today: '2027-02-21', sent: [] })).toBeNull();
  });

  it('premier lien à J-21, puis rien jusqu’à la veille', () => {
    expect(dueBalanceReminder({ ...booking, today: '2027-02-22', sent: [] })).toEqual({
      kind: 'balance_due',
      rank: 1,
      scheduledFor: '2027-02-22',
    });
    const first = [{ kind: 'balance_due' as const, rank: 1 }];
    expect(dueBalanceReminder({ ...booking, today: '2027-02-25', sent: first })).toBeNull();
  });

  it('rappel la veille de la date limite (J-15)', () => {
    expect(
      dueBalanceReminder({
        ...booking,
        today: '2027-02-28',
        sent: [{ kind: 'balance_due', rank: 1 }],
      }),
    ).toMatchObject({ kind: 'balance_due', rank: 2 });
  });

  it('à la date limite : relance « en retard » (alerte équipe + dernier rappel)', () => {
    const sent = [
      { kind: 'balance_due' as const, rank: 1 },
      { kind: 'balance_due' as const, rank: 2 },
    ];
    expect(dueBalanceReminder({ ...booking, today: DUE, sent })).toMatchObject({
      kind: 'balance_overdue',
      rank: 1,
    });
    // Jamais deux fois, même plusieurs jours après.
    expect(
      dueBalanceReminder({
        ...booking,
        today: '2027-03-04',
        sent: [...sent, { kind: 'balance_overdue', rank: 1 }],
      }),
    ).toBeNull();
  });

  it('tâche interrompue : seule l’étape la plus récente est envoyée, pas les manquées', () => {
    expect(dueBalanceReminder({ ...booking, today: '2027-03-02', sent: [] })).toMatchObject({
      kind: 'balance_overdue',
    });
    expect(dueBalanceReminder({ ...booking, today: '2027-02-28', sent: [] })).toMatchObject({
      kind: 'balance_due',
      rank: 2,
    });
  });

  it('aucun rappel si le solde est payé, la réservation annulée ou payée en totalité', () => {
    for (const status of ['paid', 'cancelled', 'cancellation_requested', 'completed'] as const) {
      expect(dueBalanceReminder({ ...booking, status, today: DUE, sent: [] })).toBeNull();
    }
    expect(
      dueBalanceReminder({
        status: 'deposit_paid',
        paymentPlan: 'full',
        balanceDueDate: null,
        today: DUE,
        sent: [],
      }),
    ).toBeNull();
  });
});
