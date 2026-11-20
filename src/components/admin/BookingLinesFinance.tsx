import type { UIFieldServerProps } from 'payload';
import { offerTypeOptions } from '@/fields/checkout';
import { ratePercent } from '@/lib/checkout/statement';
import { formatSignedXof } from '@/lib/pricing';
import { FINANCE_ROLES } from './partnerStatementPath';

// Commissions d'une réservation dans l'admin (002, US5, T094, FR-033) : par ligne, le
// prestataire, le montant, le taux figé au paiement, la commission et la part à reverser, nets
// des remboursements (somme des écritures de commission). Rôles `finance` et `admin` : les
// opérations ne voient pas les montants à reverser (data-model « Rôles »).

const cell = {
  padding: '6px 10px',
  borderBottom: '1px solid var(--theme-elevation-150)',
  verticalAlign: 'top',
} as const;

const numeric = { ...cell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' } as const;

const OFFER_LABELS = new Map(offerTypeOptions.map((option) => [option.value, option.label]));

const relationId = (value: number | { id: number }): number =>
  typeof value === 'number' ? value : value.id;

type LineTotals = { collected: number; commission: number; partner: number };

export const BookingLinesFinance = async ({ id, req }: UIFieldServerProps) => {
  const role = req.user && 'role' in req.user ? req.user.role : null;
  if (typeof role !== 'string' || !FINANCE_ROLES.has(role) || id === undefined) return null;
  const bookingId = Number(id);
  const { payload } = req;
  const [booking, entries] = await Promise.all([
    payload.findByID({ collection: 'bookings', id: bookingId, depth: 0 }).catch(() => null),
    payload.find({
      collection: 'commissionEntries',
      where: { booking: { equals: bookingId } },
      pagination: false,
      depth: 0,
    }),
  ]);
  const lines = booking?.lines ?? [];
  if (lines.length === 0) return null;
  const partnerIds = [
    ...new Set(lines.flatMap((line) => (line.partner ? [relationId(line.partner)] : []))),
  ];
  const partners =
    partnerIds.length === 0
      ? []
      : (
          await payload.find({
            collection: 'partners',
            where: { id: { in: partnerIds } },
            select: { name: true },
            pagination: false,
            depth: 0,
          })
        ).docs;
  const partnerNames = new Map(partners.map((partner) => [partner.id, partner.name]));
  const totals = new Map<string, LineTotals>();
  for (const entry of entries.docs) {
    const current = totals.get(entry.lineId) ?? { collected: 0, commission: 0, partner: 0 };
    totals.set(entry.lineId, {
      collected: current.collected + entry.grossAmount,
      commission: current.commission + entry.commissionAmount,
      partner: current.partner + entry.partnerAmount,
    });
  }
  const sumOf = (key: keyof LineTotals) =>
    [...totals.values()].reduce((sum, line) => sum + line[key], 0);

  return (
    <section style={{ margin: '24px 0' }} aria-labelledby="booking-finance-title">
      <h3 id="booking-finance-title" style={{ marginBottom: 8 }}>
        Commissions et parts prestataires
      </h3>
      <p style={{ marginBottom: 8 }}>
        Taux figé au premier paiement réussi ; montants nets des remboursements.
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse' }} data-testid="booking-finance">
        <thead>
          <tr>
            {['Prestation', 'Type', 'Prestataire'].map((label) => (
              <th key={label} scope="col" style={{ ...cell, textAlign: 'left' }}>
                {label}
              </th>
            ))}
            {['Montant', 'Encaissé net', 'Taux', 'Commission', 'Part à reverser'].map((label) => (
              <th key={label} scope="col" style={numeric}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const amounts = totals.get(line.lineId) ?? { collected: 0, commission: 0, partner: 0 };
            const partner = line.partner ? relationId(line.partner) : null;
            return (
              <tr key={line.lineId}>
                <td style={cell}>
                  {line.title}
                  {line.cancelled ? ' (annulée)' : ''}
                </td>
                <td style={cell}>{OFFER_LABELS.get(line.offerType) ?? line.offerType}</td>
                <td style={cell}>
                  {partner === null ? '—' : (partnerNames.get(partner) ?? `#${partner}`)}
                </td>
                <td style={numeric}>{formatSignedXof(line.lineTotal)}</td>
                <td style={numeric}>{formatSignedXof(amounts.collected)}</td>
                <td style={numeric}>
                  {typeof line.commissionRateBp === 'number'
                    ? `${ratePercent(line.commissionRateBp)} %`
                    : '—'}
                </td>
                <td style={numeric}>{formatSignedXof(amounts.commission)}</td>
                <td style={numeric}>{formatSignedXof(amounts.partner)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colSpan={4} style={{ ...cell, textAlign: 'left' }}>
              Total
            </th>
            <td style={numeric}>{formatSignedXof(sumOf('collected'))}</td>
            <td style={cell} />
            <td style={numeric}>{formatSignedXof(sumOf('commission'))}</td>
            <td style={numeric}>{formatSignedXof(sumOf('partner'))}</td>
          </tr>
        </tfoot>
      </table>
    </section>
  );
};
