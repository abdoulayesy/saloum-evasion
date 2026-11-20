import { NextResponse, type NextRequest } from 'next/server';
import { canAccessBooking } from '@/lib/booking/access';
import { checkoutPath } from '@/lib/checkout/paths';
import { isPaymentApplied } from '@/lib/checkout/stateMachines';
import { getPayloadClient } from '@/lib/cms/queries';
import { isLocale } from '@/i18n/routing';

// Statut d'une tentative de paiement, interrogé toutes les 3 s par l'îlot de la page statut
// (002, T057). Accès : cookie du panier ou jeton de gestion. Réponse minimale.

export const dynamic = 'force-dynamic';

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> },
) => {
  const id = Number((await params).paymentId);
  if (!Number.isInteger(id) || id <= 0) return json({ error: 'Introuvable' }, 404);
  const payload = await getPayloadClient();
  const payment = await payload
    .findByID({ collection: 'payments', id, depth: 0, disableErrors: true })
    .catch(() => null);
  if (!payment) return json({ error: 'Introuvable' }, 404);
  const bookingId = typeof payment.booking === 'number' ? payment.booking : payment.booking.id;
  const booking = await payload.findByID({
    collection: 'bookings',
    id: bookingId,
    depth: 0,
    showHiddenFields: true,
  });
  const token = request.nextUrl.searchParams.get('k');
  if (!(await canAccessBooking(payload, booking, token)))
    return json({ error: 'Introuvable' }, 404);
  const localeParam = request.nextUrl.searchParams.get('locale') ?? booking.locale;
  const locale = isLocale(localeParam) ? localeParam : booking.locale;
  // Réussite annoncée seulement une fois appliquée à la réservation (sinon : encore en attente).
  const applied = isPaymentApplied(payment, booking);
  return json({
    status: payment.status === 'succeeded' && !applied ? 'pending' : payment.status,
    failureReason: payment.failureReason ?? null,
    // Jeton conservé : le solde peut être payé depuis un appareil sans le cookie du panier.
    bookingUrl: applied
      ? `${checkoutPath(locale, 'booking', booking.reference)}${token ? `?k=${encodeURIComponent(token)}` : ''}`
      : undefined,
  });
};
