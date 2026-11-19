import { describe, expect, it } from 'vitest';
import { daysBetween, isDepositEligible, paymentPlan } from '@/lib/checkout/deposit';

// T010 (FR-016) : acompte de 30 % au-delà de 30 jours, solde à J-14.
const TODAY = '2027-01-01';

describe('acompte', () => {
  it('jours entre deux dates civiles', () => {
    expect(daysBetween('2027-01-01', '2027-01-31')).toBe(30);
    expect(daysBetween('2027-02-28', '2027-03-01')).toBe(1);
    expect(daysBetween('2027-01-05', '2027-01-01')).toBe(-4);
  });

  it('éligible strictement au-delà de 30 jours, sauf `requireFullPayment`', () => {
    expect(
      isDepositEligible({
        today: TODAY,
        firstArrivalDate: '2027-01-31',
        requireFullPayment: false,
      }),
    ).toBe(false);
    expect(
      isDepositEligible({
        today: TODAY,
        firstArrivalDate: '2027-02-01',
        requireFullPayment: false,
      }),
    ).toBe(true);
    expect(
      isDepositEligible({ today: TODAY, firstArrivalDate: '2027-06-01', requireFullPayment: true }),
    ).toBe(false);
  });

  it('acompte arrondi à la centaine supérieure ; acompte + solde = total ; solde dû à J-14', () => {
    const plan = paymentPlan({
      total: 487_350,
      today: TODAY,
      firstArrivalDate: '2027-03-15',
      requireFullPayment: false,
    });
    expect(plan).toEqual({
      plan: 'deposit',
      depositAmount: 146_300, // 146 205 → 146 300
      balanceAmount: 341_050,
      balanceDueDate: '2027-03-01',
      amountDueNow: 146_300,
    });
    if (plan.plan === 'deposit') expect(plan.depositAmount + plan.balanceAmount).toBe(487_350);
  });

  it('paiement total quand l’arrivée est proche, avec la raison', () => {
    expect(
      paymentPlan({
        total: 90_000,
        today: TODAY,
        firstArrivalDate: '2027-01-10',
        requireFullPayment: false,
      }),
    ).toEqual({
      plan: 'full',
      depositAmount: 0,
      balanceAmount: 0,
      balanceDueDate: null,
      amountDueNow: 90_000,
      reason: 'arrival_soon',
    });
  });

  it('séjour qui exige le paiement total : raison distincte, même loin de l’arrivée', () => {
    expect(
      paymentPlan({
        total: 300_000,
        today: TODAY,
        firstArrivalDate: '2027-06-01',
        requireFullPayment: true,
      }),
    ).toMatchObject({ plan: 'full', amountDueNow: 300_000, reason: 'full_payment_required' });
  });

  it('réglages du site pris en compte (pourcentage, seuil, échéance)', () => {
    const plan = paymentPlan({
      total: 100_000,
      today: TODAY,
      firstArrivalDate: '2027-02-20',
      requireFullPayment: false,
      settings: { depositPercent: 50, depositThresholdDays: 45, balanceDueDaysBeforeArrival: 7 },
    });
    expect(plan).toMatchObject({
      plan: 'deposit',
      depositAmount: 50_000,
      balanceDueDate: '2027-02-13',
    });
  });
});
