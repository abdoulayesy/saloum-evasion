import { renderToBuffer } from '@react-pdf/renderer';
import type { Payload } from 'payload';
import { bookingSummarySource } from '@/lib/booking/summarySource';
import type { Booking } from '@/payload-types';
import { Voucher, type VoucherData } from './Voucher';

// Rendu du bon de réservation (002, T060), côté serveur uniquement (D-T17). Le PDF est produit à
// la demande (route sécurisée, pièce jointe de l'e-mail) à partir de la réservation : il reflète
// toujours son dernier état (`voucher.version` incrémenté à chaque changement).

export type { VoucherData } from './Voucher';

export const renderVoucherPdf = async (data: VoucherData): Promise<Buffer> =>
  // `Voucher` renvoie directement l'élément `Document` attendu par le moteur PDF.
  renderToBuffer(Voucher({ data }));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const voucherDataFor = async (payload: Payload, booking: Booking): Promise<VoucherData> => {
  const settings = await payload.findGlobal({
    slug: 'siteSettings',
    locale: booking.locale,
    depth: 0,
  });
  const address = settings.address;
  return {
    reference: booking.reference,
    locale: booking.locale,
    traveller: booking.traveller,
    status: booking.status,
    source: bookingSummarySource(booking),
    availability: Object.fromEntries(
      (booking.lines ?? []).map((line) => [line.lineId, line.availabilityStatus]),
    ),
    policies: (booking.lines ?? []).flatMap((line) => {
      const snapshot: unknown = line.policySnapshot;
      return isRecord(snapshot) && typeof snapshot.summary === 'string' && snapshot.summary
        ? [{ title: line.title, summary: snapshot.summary }]
        : [];
    }),
    agency: {
      name: settings.brandName ?? 'Saloum Évasion',
      address: [address?.streetAddress, address?.locality, address?.region, address?.country]
        .filter(Boolean)
        .join(', '),
      phone: settings.phone ?? undefined,
      whatsapp: settings.whatsappNumber ?? undefined,
      email: settings.email ?? undefined,
    },
  };
};

export const renderBookingVoucher = async (
  payload: Payload,
  bookingId: number,
): Promise<Buffer> => {
  const booking = await payload.findByID({ collection: 'bookings', id: bookingId, depth: 0 });
  return renderVoucherPdf(await voucherDataFor(payload, booking));
};
