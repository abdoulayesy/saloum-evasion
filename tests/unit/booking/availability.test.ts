import { describe, expect, it } from 'vitest';
import {
  alternativeErrors,
  alternativeOutcome,
  choiceDeadline,
  isAutoRefundDue,
} from '@/lib/booking/availability';

// T089 (US4, FR-005, FR-030) : au plus deux alternatives, jamais de supplément, écart en faveur
// du voyageur remboursé, choix sous 48 h sinon remboursement intégral automatique.

const MARKED = '2027-01-10T09:00:00.000Z';

describe('prestation indisponible', () => {
  it('choix attendu sous 48 h', () => {
    expect(choiceDeadline(MARKED)).toBe('2027-01-12T09:00:00.000Z');
  });

  it('au plus deux alternatives, chacune avec un libellé et un prix entier', () => {
    const valid = { title: 'Pirogue au coucher du soleil', price: 30_000 };
    expect(alternativeErrors([valid, valid])).toEqual([]);
    expect(alternativeErrors([valid, valid, valid])).toContain(
      'Deux alternatives au plus pour une prestation indisponible.',
    );
    expect(alternativeErrors([{ title: '', price: 1 }])).toHaveLength(1);
    expect(alternativeErrors([{ title: 'Kayak', price: 10.5 }])).toHaveLength(1);
  });

  it('alternative plus chère : facturée au prix d’origine, aucun supplément', () => {
    expect(
      alternativeOutcome({ originalTotal: 40_000, paidForLine: 40_000, alternativePrice: 55_000 }),
    ).toEqual({ lineTotal: 40_000, refund: 0, totalReduction: 0 });
  });

  it('alternative moins chère, payée en totalité : écart remboursé', () => {
    expect(
      alternativeOutcome({ originalTotal: 40_000, paidForLine: 40_000, alternativePrice: 30_000 }),
    ).toEqual({ lineTotal: 30_000, refund: 10_000, totalReduction: 10_000 });
  });

  it('acompte seulement : l’écart réduit le solde, rien à rembourser', () => {
    expect(
      alternativeOutcome({ originalTotal: 40_000, paidForLine: 12_000, alternativePrice: 30_000 }),
    ).toEqual({ lineTotal: 30_000, refund: 0, totalReduction: 10_000 });
  });

  it('remboursement intégral automatique après 48 h sans choix', () => {
    const line = {
      availabilityStatus: 'unavailable',
      choiceDeadline: choiceDeadline(MARKED),
      travellerChoice: null,
    };
    expect(isAutoRefundDue(line, new Date('2027-01-12T08:59:00Z'))).toBe(false);
    expect(isAutoRefundDue(line, new Date('2027-01-12T09:00:00Z'))).toBe(true);
    expect(
      isAutoRefundDue({ ...line, travellerChoice: 'alternative_1' }, new Date('2027-01-13')),
    ).toBe(false);
    expect(
      isAutoRefundDue({ ...line, availabilityStatus: 'replaced' }, new Date('2027-01-13')),
    ).toBe(false);
  });
});
