import { renderToBuffer } from '@react-pdf/renderer';
import type { Payload } from 'payload';
import { bookingSummarySource } from '@/lib/booking/summarySource';
import { siteUrl } from '@/lib/site';
import type { Booking } from '@/payload-types';
import { PassportDocument } from './PassportDocument';
import { buildPassport, type VoucherData, type VoucherLineDetail } from './model';

// Rendu du bon de réservation (002, T060 ; maquette « Passeport d'évasion »), côté serveur
// uniquement (D-T17). Le PDF est produit à la demande (route sécurisée, pièce jointe de l'e-mail)
// à partir de la réservation : il reflète toujours son dernier état (`voucher.version`).

export type { VoucherData } from './model';

export const renderVoucherPdf = async (data: VoucherData): Promise<Buffer> =>
  // `PassportDocument` renvoie directement l'élément `Document` attendu par le moteur PDF.
  renderToBuffer(PassportDocument({ passport: buildPassport(data), author: data.agency.name }));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const idOf = (value: unknown): number | null => {
  if (typeof value === 'number') return value;
  if (isRecord(value) && typeof value.id === 'number') return value.id;
  return null;
};

const nameOf = (value: unknown, key: 'name' | 'title' = 'name'): string | undefined => {
  if (!isRecord(value)) return undefined;
  const name = value[key];
  return typeof name === 'string' && name ? name : undefined;
};

const slugOf = (value: unknown): string | undefined => {
  if (!isRecord(value) || !isRecord(value.seo)) return undefined;
  const slug = value.seo.slug;
  return typeof slug === 'string' && slug ? slug : undefined;
};

type BookingLine = NonNullable<Booking['lines']>[number];

/** Détails d'une ligne lus sur l'offre (langue de la réservation et autre langue). */
const lineDetail = async (
  payload: Payload,
  line: BookingLine,
  locale: 'fr' | 'en',
): Promise<VoucherLineDetail> => {
  const offerId = idOf(line.offer.value);
  if (offerId === null) return {};
  const other = locale === 'fr' ? 'en' : 'fr';
  const collection = line.offer.relationTo;
  const [doc, alt, partner] = await Promise.all([
    payload
      .findByID({ collection, id: offerId, locale, depth: 1, disableErrors: true })
      .catch(() => null),
    payload
      .findByID({ collection, id: offerId, locale: other, depth: 0, disableErrors: true })
      .catch(() => null),
    idOf(line.partner) !== null
      ? payload
          .findByID({
            collection: 'partners',
            id: idOf(line.partner) ?? 0,
            depth: 0,
            disableErrors: true,
          })
          .catch(() => null)
      : Promise.resolve(null),
  ]);
  if (!doc) return {};
  const record: Record<string, unknown> = { ...doc };
  const altTitle = nameOf(alt, 'title');
  const destination =
    nameOf(record.destination) ??
    nameOf(Array.isArray(record.destinations) ? record.destinations[0] : undefined);
  return {
    summary: typeof record.summary === 'string' ? record.summary : undefined,
    meetingPoint: typeof record.meetingPoint === 'string' ? record.meetingPoint : undefined,
    durationMinutes:
      typeof record.durationMinutes === 'number' ? record.durationMinutes : undefined,
    destination,
    slug: slugOf(record),
    universeSlug: slugOf(record.universe),
    partnerName: nameOf(partner),
    altTitle: altTitle && altTitle !== line.title ? altTitle : undefined,
    transferOrigin:
      record.origin === 'aibd' || record.origin === 'dakar' ? record.origin : undefined,
  };
};

export const voucherDataFor = async (payload: Payload, booking: Booking): Promise<VoucherData> => {
  const [settings, payments, details] = await Promise.all([
    payload.findGlobal({ slug: 'siteSettings', locale: booking.locale, depth: 0 }),
    payload.find({
      collection: 'payments',
      where: { and: [{ booking: { equals: booking.id } }, { status: { equals: 'succeeded' } }] },
      sort: '-confirmedAt',
      limit: 1,
      depth: 0,
    }),
    Promise.all(
      (booking.lines ?? []).map(
        async (line) => [line.lineId, await lineDetail(payload, line, booking.locale)] as const,
      ),
    ),
  ]);
  const address = settings.address;
  const [payment] = payments.docs;
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
    details: Object.fromEntries(details),
    payment: payment
      ? {
          method: payment.method,
          confirmedAt: payment.confirmedAt ?? payment.updatedAt,
          reference: payment.gatewayReference ?? undefined,
        }
      : undefined,
    siteUrl: siteUrl(),
  };
};

export const renderBookingVoucher = async (
  payload: Payload,
  bookingId: number,
): Promise<Buffer> => {
  const booking = await payload.findByID({ collection: 'bookings', id: bookingId, depth: 0 });
  return renderVoucherPdf(await voucherDataFor(payload, booking));
};
