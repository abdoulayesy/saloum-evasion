import type { Payload } from 'payload';
import {
  buildStatement,
  type Statement,
  type StatementEntry,
  type StatementPeriod,
} from '@/lib/checkout/statement';

// Données du relevé prestataire (002, US5, T095) : écritures de commission et reversements du
// prestataire, libellés des lignes figés dans la réservation. Partagé par la vue de l'admin et
// l'export CSV ; l'appelant vérifie le rôle (`finance` ou `admin`).

const relationId = (value: number | { id: number }): number =>
  typeof value === 'number' ? value : value.id;

/** Bornes ISO de la période (UTC = heure de Dakar), pour la requête des écritures. */
const isoBounds = (period: StatementPeriod) => ({
  start: `${period.from}T00:00:00.000Z`,
  end: `${period.to}T23:59:59.999Z`,
});

export const loadStatement = async (
  payload: Payload,
  partnerId: number,
  period: StatementPeriod,
): Promise<Statement> => {
  const { start, end } = isoBounds(period);
  const [entries, payouts] = await Promise.all([
    payload.find({
      collection: 'commissionEntries',
      where: {
        and: [
          { partner: { equals: partnerId } },
          { occurredAt: { greater_than_equal: start } },
          { occurredAt: { less_than_equal: end } },
        ],
      },
      sort: 'occurredAt',
      pagination: false,
      depth: 0,
    }),
    payload.find({
      collection: 'payouts',
      where: {
        and: [
          { partner: { equals: partnerId } },
          { periodStart: { greater_than_equal: period.from } },
          { periodEnd: { less_than_equal: period.to } },
        ],
      },
      sort: 'paidAt',
      pagination: false,
      depth: 0,
    }),
  ]);
  const bookingIds = [...new Set(entries.docs.map((entry) => relationId(entry.booking)))];
  const bookings =
    bookingIds.length === 0
      ? []
      : (
          await payload.find({
            collection: 'bookings',
            where: { id: { in: bookingIds } },
            select: { reference: true, lines: true },
            pagination: false,
            depth: 0,
          })
        ).docs;
  const byId = new Map(bookings.map((booking) => [booking.id, booking]));
  const statementEntries: StatementEntry[] = entries.docs.map((entry) => {
    const booking = byId.get(relationId(entry.booking));
    const line = booking?.lines?.find((candidate) => candidate.lineId === entry.lineId);
    return {
      bookingReference: booking?.reference ?? '',
      lineId: entry.lineId,
      lineTitle: line?.title ?? entry.lineId,
      kind: entry.kind,
      grossAmount: entry.grossAmount,
      commissionAmount: entry.commissionAmount,
      partnerAmount: entry.partnerAmount,
      rateBp: entry.rateBp,
      occurredAt: entry.occurredAt,
    };
  });
  return buildStatement({
    period,
    entries: statementEntries,
    payouts: payouts.docs.map((payout) => ({
      periodStart: payout.periodStart,
      periodEnd: payout.periodEnd,
      amount: payout.amount,
      method: payout.method,
      reference: payout.reference,
      paidAt: payout.paidAt,
    })),
  });
};
