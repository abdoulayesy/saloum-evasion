import { DefaultTemplate } from '@payloadcms/next/templates';
import { redirect } from 'next/navigation';
import type { AdminViewServerProps } from 'payload';
import { loadStatement } from '@/lib/booking/statementData';
import {
  ENTRY_KIND_LABELS,
  PAYOUT_METHOD_LABELS,
  monthOf,
  periodErrors,
  ratePercent,
  type Statement,
  type StatementPeriod,
} from '@/lib/checkout/statement';
import { formatSignedXof } from '@/lib/pricing';
import { recordPayout } from './partnerStatementActions';
import { FINANCE_ROLES, PARTNER_STATEMENT_PATH, statementExportPath } from './partnerStatementPath';

// Vue « Relevés prestataires » de l'admin (002, US5, T095, FR-036) : pour un prestataire et une
// période, montants encaissés, commissions, remboursements déduits, reste à reverser et
// reversements enregistrés ; saisie d'un reversement et export tableur. Rôles `finance` et
// `admin`. Admin sur ordinateur (dérogation D-T6b).

const cell = {
  padding: '8px 12px',
  borderBottom: '1px solid var(--theme-elevation-150)',
  verticalAlign: 'top',
} as const;

const numeric = { ...cell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' } as const;

const field = { display: 'flex', flexDirection: 'column', gap: 4 } as const;

const row = { display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' } as const;

const param = (value: string | string[] | undefined): string =>
  typeof value === 'string' ? value : '';

const TotalsList = ({ statement }: { statement: Statement }) => {
  const { totals } = statement;
  const items: [string, number, string][] = [
    ['Encaissé', totals.collected, 'total-collected'],
    ['Commissions retenues', totals.commission, 'total-commission'],
    ['Remboursements déduits', totals.refunded, 'total-refunded'],
    ['Commissions annulées par les remboursements', totals.commissionReversed, 'total-reversed'],
    ['Part du prestataire', totals.partnerDue, 'total-partner'],
    ['Déjà reversé', totals.paidOut, 'total-paid-out'],
    ['Reste à reverser', totals.balance, 'total-balance'],
  ];
  return (
    <dl
      style={{ display: 'grid', gridTemplateColumns: 'max-content max-content', gap: '4px 24px' }}
    >
      {items.map(([label, amount, testId]) => (
        <div key={testId} style={{ display: 'contents' }}>
          <dt style={testId === 'total-balance' ? { fontWeight: 700 } : undefined}>{label}</dt>
          <dd
            data-testid={testId}
            data-amount={amount}
            style={{
              margin: 0,
              textAlign: 'right',
              fontVariantNumeric: 'tabular-nums',
              fontWeight: testId === 'total-balance' ? 700 : 400,
            }}
          >
            {formatSignedXof(amount)}
          </dd>
        </div>
      ))}
    </dl>
  );
};

const EntriesTable = ({ statement }: { statement: Statement }) =>
  statement.entries.length === 0 ? (
    <p>Aucune écriture sur cette période.</p>
  ) : (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <caption style={{ textAlign: 'left', marginBottom: 8 }}>
        {statement.entries.length} écriture(s)
      </caption>
      <thead>
        <tr>
          {['Date', 'Réservation', 'Prestation', 'Nature'].map((label) => (
            <th key={label} scope="col" style={{ ...cell, textAlign: 'left' }}>
              {label}
            </th>
          ))}
          {['Montant', 'Taux', 'Commission', 'Part prestataire'].map((label) => (
            <th key={label} scope="col" style={numeric}>
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {statement.entries.map((entry, index) => (
          <tr key={`${entry.bookingReference}-${entry.lineId}-${index}`}>
            <td style={cell}>{entry.occurredAt.slice(0, 10)}</td>
            <td style={cell}>{entry.bookingReference}</td>
            <td style={cell}>{entry.lineTitle}</td>
            <td style={cell}>{ENTRY_KIND_LABELS[entry.kind]}</td>
            <td style={numeric}>{formatSignedXof(entry.grossAmount)}</td>
            <td style={numeric}>{ratePercent(entry.rateBp)} %</td>
            <td style={numeric}>{formatSignedXof(entry.commissionAmount)}</td>
            <td style={numeric}>{formatSignedXof(entry.partnerAmount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

const PayoutsTable = ({ statement }: { statement: Statement }) =>
  statement.payouts.length === 0 ? (
    <p>Aucun reversement enregistré pour cette période.</p>
  ) : (
    <table style={{ width: '100%', borderCollapse: 'collapse' }} data-testid="payouts">
      <thead>
        <tr>
          {['Versé le', 'Période couverte', 'Moyen', 'Référence'].map((label) => (
            <th key={label} scope="col" style={{ ...cell, textAlign: 'left' }}>
              {label}
            </th>
          ))}
          <th scope="col" style={numeric}>
            Montant
          </th>
        </tr>
      </thead>
      <tbody>
        {statement.payouts.map((payout, index) => (
          <tr key={`${payout.paidAt}-${index}`}>
            <td style={cell}>{payout.paidAt.slice(0, 10)}</td>
            <td style={cell}>
              du {payout.periodStart} au {payout.periodEnd}
            </td>
            <td style={cell}>{PAYOUT_METHOD_LABELS[payout.method]}</td>
            <td style={cell}>{payout.reference ?? '—'}</td>
            <td style={numeric}>{formatSignedXof(payout.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

const PayoutForm = ({
  partnerId,
  period,
  suggested,
  today,
}: {
  partnerId: number;
  period: StatementPeriod;
  suggested: number;
  today: string;
}) => (
  <form action={recordPayout} style={{ display: 'grid', gap: 16 }}>
    <input type="hidden" name="partnerId" value={partnerId} />
    <input type="hidden" name="periodStart" value={period.from} />
    <input type="hidden" name="periodEnd" value={period.to} />
    <p style={{ margin: 0 }}>
      Période couverte : du {period.from} au {period.to}. Le versement lui-même se fait hors du
      site.
    </p>
    <div style={row}>
      <div style={field}>
        <label htmlFor="payout-amount">Montant versé (FCFA)</label>
        <input
          id="payout-amount"
          name="amount"
          type="number"
          min={1}
          step={1}
          required
          defaultValue={suggested > 0 ? suggested : undefined}
        />
      </div>
      <div style={field}>
        <label htmlFor="payout-method">Moyen</label>
        <select id="payout-method" name="method" required defaultValue="wave">
          {Object.entries(PAYOUT_METHOD_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div style={field}>
        <label htmlFor="payout-reference">Référence du versement</label>
        <input id="payout-reference" name="reference" type="text" maxLength={200} />
      </div>
      <div style={field}>
        <label htmlFor="payout-date">Versé le</label>
        <input id="payout-date" name="paidAt" type="date" required defaultValue={today} />
      </div>
      <button type="submit" className="btn btn--style-primary btn--size-medium">
        Enregistrer le reversement
      </button>
    </div>
  </form>
);

export const PartnerStatement = async ({
  initPageResult,
  params,
  searchParams,
}: AdminViewServerProps) => {
  const { req, permissions, visibleEntities, locale } = initPageResult;
  const role = req.user && 'role' in req.user ? req.user.role : null;
  if (typeof role !== 'string' || !FINANCE_ROLES.has(role)) redirect('/admin');
  const { payload } = req;
  const today = new Date().toISOString().slice(0, 10);
  const month = monthOf(today);
  const period: StatementPeriod = {
    from: param(searchParams?.du) || month.from,
    to: param(searchParams?.au) || month.to,
  };
  const errors = periodErrors(period);
  const partnerId = Number(param(searchParams?.prestataire));
  const { docs: partners } = await payload.find({
    collection: 'partners',
    sort: 'name',
    pagination: false,
    depth: 0,
    select: { name: true },
  });
  const partner = partners.find((candidate) => candidate.id === partnerId) ?? null;
  const statement =
    partner && errors.length === 0 ? await loadStatement(payload, partner.id, period) : null;
  const recorded = param(searchParams?.enregistre) === '1';
  const payoutError = param(searchParams?.erreur) === 'reversement';

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={payload}
      permissions={permissions}
      searchParams={searchParams}
      user={req.user ?? undefined}
      visibleEntities={visibleEntities}
    >
      <div className="gutter--left gutter--right" style={{ paddingBottom: 48 }}>
        <h1 style={{ margin: '24px 0 8px' }}>Relevés prestataires</h1>
        <p style={{ marginBottom: 16 }}>
          Écritures de la période (encaissements et remboursements, au taux figé au paiement) moins
          les reversements dont la période couverte est incluse dans celle du relevé.
        </p>
        <form method="get" action={PARTNER_STATEMENT_PATH} style={{ ...row, marginBottom: 24 }}>
          <div style={field}>
            <label htmlFor="statement-partner">Prestataire</label>
            <select
              id="statement-partner"
              name="prestataire"
              required
              defaultValue={partner ? String(partner.id) : ''}
            >
              <option value="" disabled>
                Choisir…
              </option>
              {partners.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </option>
              ))}
            </select>
          </div>
          <div style={field}>
            <label htmlFor="statement-from">Du</label>
            <input id="statement-from" name="du" type="date" required defaultValue={period.from} />
          </div>
          <div style={field}>
            <label htmlFor="statement-to">Au</label>
            <input id="statement-to" name="au" type="date" required defaultValue={period.to} />
          </div>
          <button type="submit" className="btn btn--style-secondary btn--size-medium">
            Afficher le relevé
          </button>
        </form>
        {errors.length > 0 && (
          <p role="alert" style={{ fontWeight: 600 }}>
            {errors.join(' ')}
          </p>
        )}
        {recorded && (
          <p role="status" style={{ fontWeight: 600 }}>
            Reversement enregistré.
          </p>
        )}
        {payoutError && (
          <p role="alert" style={{ fontWeight: 600 }}>
            Reversement non enregistré : vérifiez le montant (FCFA entier), le moyen et la date.
          </p>
        )}
        {partner && statement && (
          <>
            <h2 style={{ margin: '24px 0 8px' }}>
              {partner.name} — du {period.from} au {period.to}
            </h2>
            <TotalsList statement={statement} />
            <p style={{ margin: '16px 0' }}>
              <a href={statementExportPath(partner.id, period.from, period.to)} download>
                Exporter en tableur (CSV)
              </a>
            </p>
            <h3 style={{ margin: '24px 0 8px' }}>Écritures</h3>
            <EntriesTable statement={statement} />
            <h3 style={{ margin: '24px 0 8px' }}>Reversements</h3>
            <PayoutsTable statement={statement} />
            <h3 style={{ margin: '24px 0 8px' }}>Enregistrer un reversement</h3>
            <PayoutForm
              partnerId={partner.id}
              period={period}
              suggested={statement.totals.balance}
              today={today}
            />
          </>
        )}
      </div>
    </DefaultTemplate>
  );
};
