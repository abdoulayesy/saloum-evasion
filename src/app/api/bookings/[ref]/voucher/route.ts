import type { NextRequest } from 'next/server';
import { canAccessBooking, findBookingByReference } from '@/lib/booking/access';
import { BOOKING_REFERENCE_PATTERN } from '@/lib/checkout/paths';
import { getPayloadClient } from '@/lib/cms/queries';
import { renderVoucherPdf, voucherDataFor } from '@/lib/voucher/render';

// Bon de réservation PDF (002, T060) : dernière version, accès par jeton de gestion (`?k=`) ou
// cookie du panier ; jamais mis en cache partagé ; aucune indication si la référence n'existe pas.

export const dynamic = 'force-dynamic';

const notFound = () =>
  new Response('Introuvable', { status: 404, headers: { 'Cache-Control': 'no-store' } });

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ ref: string }> },
) => {
  const reference = (await params).ref.toUpperCase();
  if (!BOOKING_REFERENCE_PATTERN.test(reference)) return notFound();
  const payload = await getPayloadClient();
  const booking = await findBookingByReference(payload, reference);
  if (!booking || booking.status === 'awaiting_payment' || booking.status === 'expired')
    return notFound();
  if (!(await canAccessBooking(payload, booking, request.nextUrl.searchParams.get('k'))))
    return notFound();
  const pdf = await renderVoucherPdf(await voucherDataFor(payload, booking));
  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${booking.reference}.pdf"`,
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
};
