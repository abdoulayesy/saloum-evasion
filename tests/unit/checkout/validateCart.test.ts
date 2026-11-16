import { describe, expect, it } from 'vitest';
import { firstArrivalDate, validateCart, type CartLine } from '@/lib/checkout/validateCart';

// T013 (FR-004) : cohérence du panier avant paiement.
const TODAY = '2027-01-01';

const line = (
  overrides: Partial<CartLine> & Pick<CartLine, 'lineId' | 'offerType' | 'startDate'>,
): CartLine => ({
  adults: 2,
  children: 0,
  infants: 0,
  capacity: 6,
  ...overrides,
});

const lodge = line({
  lineId: 'lodge',
  offerType: 'accommodation',
  startDate: '2027-02-10',
  endDate: '2027-02-14',
});

const codes = (lines: CartLine[]) =>
  validateCart(lines, { today: TODAY }).map(({ lineId, code }) => `${lineId}:${code}`);

describe('cohérence du panier', () => {
  it('panier composé valide : hébergement, expérience, table et aller-retour', () => {
    expect(
      codes([
        lodge,
        line({ lineId: 'pirogue', offerType: 'experience', startDate: '2027-02-11' }),
        line({ lineId: 'diner', offerType: 'table', startDate: '2027-02-14' }),
        line({
          lineId: 'in',
          offerType: 'transfer',
          transferDirection: 'outbound',
          startDate: '2027-02-10',
        }),
        line({
          lineId: 'out',
          offerType: 'transfer',
          transferDirection: 'return',
          startDate: '2027-02-14',
        }),
      ]),
    ).toEqual([]);
  });

  it('au plus un hébergement ou séjour ; un séjour exclut un hébergement séparé', () => {
    const second = { ...lodge, lineId: 'lodge2' };
    expect(codes([lodge, second])).toEqual(['lodge2:multiple_lodgings']);
    const stay = line({
      lineId: 'stay',
      offerType: 'stay',
      startDate: '2027-02-10',
      endDate: '2027-02-15',
    });
    expect(codes([stay, lodge])).toEqual(['lodge:stay_excludes_accommodation']);
  });

  it('prestations comprises entre l’arrivée et le départ', () => {
    expect(
      codes([lodge, line({ lineId: 'pirogue', offerType: 'experience', startDate: '2027-02-15' })]),
    ).toEqual(['pirogue:outside_stay_dates']);
    // Sans hébergement, aucune contrainte de période.
    expect(
      codes([line({ lineId: 'pirogue', offerType: 'experience', startDate: '2027-03-15' })]),
    ).toEqual([]);
  });

  it('transfert retour postérieur à l’aller', () => {
    expect(
      codes([
        line({
          lineId: 'in',
          offerType: 'transfer',
          transferDirection: 'outbound',
          startDate: '2027-02-10',
        }),
        line({
          lineId: 'out',
          offerType: 'transfer',
          transferDirection: 'return',
          startDate: '2027-02-10',
        }),
      ]),
    ).toEqual(['out:return_before_outbound']);
  });

  it('nuits, minimum de nuits, capacité, adulte obligatoire', () => {
    expect(codes([{ ...lodge, endDate: '2027-02-10' }])).toEqual(['lodge:invalid_nights']);
    expect(codes([{ ...lodge, minNights: 5 }])).toEqual(['lodge:below_min_nights']);
    expect(codes([{ ...lodge, adults: 4, children: 2, infants: 1 }])).toEqual([
      'lodge:over_capacity',
    ]);
    expect(codes([{ ...lodge, adults: 0, children: 2 }])).toEqual(['lodge:no_adult']);
  });

  it('délai minimum J+1 (réglable)', () => {
    const today = line({ lineId: 'pirogue', offerType: 'experience', startDate: TODAY });
    expect(codes([today])).toEqual(['pirogue:too_soon']);
    expect(codes([{ ...today, startDate: '2027-01-02' }])).toEqual([]);
    expect(
      validateCart([{ ...today, startDate: '2027-01-02' }], { today: TODAY, minLeadDays: 2 }),
    ).toHaveLength(1);
  });

  it('première date du panier', () => {
    expect(
      firstArrivalDate([
        lodge,
        line({ lineId: 'in', offerType: 'transfer', startDate: '2027-02-09' }),
      ]),
    ).toBe('2027-02-09');
    expect(firstArrivalDate([])).toBeNull();
  });
});
