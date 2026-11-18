import type { Payload } from 'payload';
import type { Locale } from '@/i18n/routing';
import { lineEndDate, type ReviewedLine } from '@/lib/cart/validate';
import { offerPartnerId, offerPolicyId } from '@/lib/cart/offers';
import { generateBookingReference } from '@/lib/checkout/reference';
import type { Booking, Cart } from '@/payload-types';

// Création de la réservation `awaiting_payment` à l'étape coordonnées (002, T052) : copie figée
// des lignes du panier (prix serveur recalculés, conditions d'annulation), idempotente pour
// `(panier, version)` grâce à l'index unique de la collection.

export type Traveller = { firstName: string; lastName: string; whatsapp: string; email: string };

type BookingLine = NonNullable<Booking['lines']>[number];

const MAX_REFERENCE_ATTEMPTS = 5;

const findExisting = async (payload: Payload, cart: Cart): Promise<Booking | null> => {
  const { docs } = await payload.find({
    collection: 'bookings',
    where: {
      and: [{ cart: { equals: cart.id } }, { cartVersion: { equals: cart.version ?? 0 } }],
    },
    limit: 1,
    depth: 0,
  });
  return docs[0] ?? null;
};

const policySnapshot = async (payload: Payload, policyId: number | null, locale: Locale) => {
  if (policyId === null) return null;
  const policy = await payload
    .findByID({
      collection: 'cancellationPolicies',
      id: policyId,
      locale,
      depth: 0,
      disableErrors: true,
    })
    .catch(() => null);
  if (!policy) return null;
  return {
    name: policy.name,
    summary: policy.summary ?? '',
    tiers: (policy.tiers ?? []).map((tier) => ({
      daysBeforeArrivalMin: tier.daysBeforeArrivalMin,
      refundPercent: tier.refundPercent,
    })),
  };
};

const freezeLine = async (
  payload: Payload,
  line: ReviewedLine,
  locale: Locale,
): Promise<BookingLine> => {
  const { item, offer } = line;
  if (!offer) throw new Error(`Ligne ${item.lineId} sans offre vendable.`);
  return {
    lineId: item.lineId,
    offerType: item.offerType,
    offer: item.offer,
    startDate: item.startDate,
    endDate: lineEndDate(item, offer) ?? null,
    slot: item.slot ?? null,
    transferDirection: item.transferDirection ?? null,
    transferTime: item.transferTime ?? null,
    adults: item.adults,
    children: item.children,
    infants: item.infants,
    quotedUnitPrice: item.quotedUnitPrice,
    quotedTotal: item.quotedTotal,
    title: line.title || '—',
    partner: offerPartnerId(offer),
    unitPrice: item.quotedTotal === line.currentTotal ? item.quotedUnitPrice : line.currentTotal,
    lineTotal: line.currentTotal,
    policySnapshot: await policySnapshot(payload, offerPolicyId(offer), locale),
    availabilityStatus: 'pending',
    cancelled: false,
  };
};

const isUniqueViolation = (error: unknown): boolean =>
  error instanceof Error &&
  /unique|duplicate/i.test(`${error.message} ${String(error.cause ?? '')}`);

export const createOrFindBooking = async (
  payload: Payload,
  {
    cart,
    reviewed,
    traveller,
    specialRequest,
    locale,
  }: {
    cart: Cart;
    reviewed: readonly ReviewedLine[];
    traveller: Traveller;
    specialRequest?: string;
    locale: Locale;
  },
): Promise<Booking> => {
  const existing = await findExisting(payload, cart);
  if (existing) {
    // Mêmes lignes (même version du panier) : seules les coordonnées peuvent changer.
    return payload.update({
      collection: 'bookings',
      id: existing.id,
      data: { traveller, specialRequest: specialRequest ?? null, locale },
    });
  }
  const lines = await Promise.all(reviewed.map((line) => freezeLine(payload, line, locale)));
  const total = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const firstArrivalDate = lines.reduce(
    (first, line) => (line.startDate < first ? line.startDate : first),
    lines[0]?.startDate ?? '',
  );
  for (let attempt = 1; attempt <= MAX_REFERENCE_ATTEMPTS; attempt += 1) {
    try {
      return await payload.create({
        collection: 'bookings',
        data: {
          reference: generateBookingReference(),
          cart: cart.id,
          cartVersion: cart.version ?? 0,
          locale,
          traveller,
          specialRequest: specialRequest ?? null,
          lines,
          total,
          amountPaid: 0,
          paymentPlan: 'full',
          depositAmount: 0,
          balanceAmount: 0,
          status: 'awaiting_payment',
          firstArrivalDate,
          voucher: { version: 0 },
          consentProcessingAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      // Doublon (panier, version) créé en parallèle : on le reprend ; sinon nouvelle référence.
      const concurrent = await findExisting(payload, cart);
      if (concurrent) return concurrent;
    }
  }
  throw new Error('Impossible d’attribuer une référence de réservation unique.');
};

/** Réservation en attente de paiement liée à la version courante du panier. */
export const findBookingForCart = findExisting;
