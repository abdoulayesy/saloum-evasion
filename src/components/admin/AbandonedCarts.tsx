import { DefaultTemplate } from '@payloadcms/next/templates';
import { redirect } from 'next/navigation';
import type { AdminViewServerProps } from 'payload';
import { formatXof } from '@/lib/pricing';
import type { Booking, Payment } from '@/payload-types';
import { resendPaymentLink } from './abandonedCartsActions';
import { ABANDONED_CARTS_PATH } from './abandonedCartsPath';

// Vue « Paniers abandonnés et paiements échoués » de l'admin (002, US3, T080, FR-032) :
// réservations encore impayées des 30 derniers jours, avec contenu, montant, dernière tentative
// et sa cause, relances envoyées et consentement ; action « Renvoyer un lien de paiement ».
// Admin sur ordinateur (dérogation D-T6b). Rôles `admin` et `operations`.

const ALLOWED_ROLES = new Set(['admin', 'operations']);
const WINDOW_DAYS = 30;
const LIMIT = 50;

const PAYMENT_LABELS: Record<Payment['status'], string> = {
  initiated: 'Commencé',
  pending: 'En attente de confirmation',
  succeeded: 'Réussi',
  failed: 'Échoué',
  abandoned: 'Abandonné sur la page de paiement',
  expired: 'Expiré',
};

const FAILURE_LABELS: Record<NonNullable<Payment['failureReason']>, string> = {
  declined: 'refusé',
  insufficient_funds: 'solde insuffisant',
  timeout: 'délai dépassé',
  cancelled_by_user: 'annulé par le voyageur',
  technical: 'problème technique',
};

const dateTime = (iso: string): string =>
  new Intl.DateTimeFormat('fr-SN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(iso));

const cell = {
  padding: '8px 12px',
  borderBottom: '1px solid var(--theme-elevation-150)',
  verticalAlign: 'top',
} as const;

const relationId = (value: number | { id: number }): number =>
  typeof value === 'number' ? value : value.id;

type Row = {
  booking: Booking;
  lastPayment: Payment | null;
  remindersSent: number;
  consent: boolean;
};

export const AbandonedCarts = async ({
  initPageResult,
  params,
  searchParams,
}: AdminViewServerProps) => {
  const { req, permissions, visibleEntities, locale } = initPageResult;
  const role = req.user && 'role' in req.user ? req.user.role : null;
  if (typeof role !== 'string' || !ALLOWED_ROLES.has(role)) redirect('/admin');
  const { payload } = req;
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { docs: bookings } = await payload.find({
    collection: 'bookings',
    where: {
      and: [
        { status: { equals: 'awaiting_payment' } },
        { createdAt: { greater_than_equal: since } },
      ],
    },
    sort: '-updatedAt',
    limit: LIMIT,
    depth: 0,
  });
  const rows: Row[] = await Promise.all(
    bookings.map(async (booking) => {
      const cartId = relationId(booking.cart);
      const [payments, reminders, cart] = await Promise.all([
        payload.find({
          collection: 'payments',
          where: { booking: { equals: booking.id } },
          sort: '-createdAt',
          limit: 1,
          depth: 0,
        }),
        payload.count({
          collection: 'reminders',
          where: {
            and: [{ targetType: { equals: 'carts' } }, { targetId: { equals: cartId } }],
          },
        }),
        payload.findByID({ collection: 'carts', id: cartId, depth: 0 }).catch(() => null),
      ]);
      return {
        booking,
        lastPayment: payments.docs[0] ?? null,
        remindersSent: reminders.totalDocs,
        consent: cart?.remindersConsent === true,
      };
    }),
  );
  const sent = typeof searchParams?.envoye === 'string' ? searchParams.envoye : null;

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
      <div className="gutter--left gutter--right">
        <h1 style={{ margin: '24px 0 8px' }}>Paniers abandonnés et paiements échoués</h1>
        <p style={{ marginBottom: 16 }}>
          Réservations encore impayées des {WINDOW_DAYS} derniers jours (coordonnées saisies). Les
          relances automatiques partent 1 h puis 24 h après la dernière action, si le voyageur l’a
          accepté.
        </p>
        {sent && (
          <p role="status" style={{ fontWeight: 600, marginBottom: 16 }}>
            Lien de paiement envoyé pour {sent} (e-mail et WhatsApp).
          </p>
        )}
        {rows.length === 0 ? (
          <p>Aucun panier abandonné ni paiement échoué.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <caption style={{ textAlign: 'left', marginBottom: 8 }}>
              {rows.length} réservation(s) impayée(s)
            </caption>
            <thead>
              <tr>
                {[
                  'Réservation',
                  'Voyageur',
                  'Contenu',
                  'Montant',
                  'Dernière tentative',
                  'Relances',
                  'Action',
                ].map((label) => (
                  <th key={label} scope="col" style={{ ...cell, textAlign: 'left' }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ booking, lastPayment, remindersSent, consent }) => (
                <tr key={booking.id}>
                  <td style={cell}>
                    <a href={`/admin/collections/bookings/${booking.id}`}>{booking.reference}</a>
                    <br />
                    <small>Dernière action : {dateTime(booking.updatedAt)}</small>
                  </td>
                  <td style={cell}>
                    {booking.traveller.firstName} {booking.traveller.lastName}
                    <br />
                    <small>
                      {booking.traveller.email} · {booking.traveller.whatsapp}
                    </small>
                  </td>
                  <td style={cell}>
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {(booking.lines ?? []).map((line) => (
                        <li key={line.lineId}>
                          {line.title} — {line.startDate}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td style={cell}>{formatXof(booking.total)}</td>
                  <td style={cell}>
                    {lastPayment
                      ? `${PAYMENT_LABELS[lastPayment.status]}${lastPayment.failureReason ? ` (${FAILURE_LABELS[lastPayment.failureReason]})` : ''}`
                      : 'Aucune (abandon avant le paiement)'}
                  </td>
                  <td style={cell}>
                    {remindersSent} envoyée(s)
                    <br />
                    <small>{consent ? 'Relances acceptées' : 'Relances non acceptées'}</small>
                  </td>
                  <td style={cell}>
                    <form action={resendPaymentLink}>
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <button type="submit" className="btn btn--style-secondary btn--size-small">
                        Renvoyer un lien de paiement
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p style={{ marginTop: 16 }}>
          <a href={ABANDONED_CARTS_PATH}>Actualiser</a>
        </p>
      </div>
    </DefaultTemplate>
  );
};
