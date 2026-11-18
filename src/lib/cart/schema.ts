import { z } from 'zod';

// Schémas des formulaires du panier (002, contrat checkout-actions « addToCart »), validés côté
// serveur à partir du FormData. Aucun montant n'est accepté du client.

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date');
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'time');
const int = (min: number, max: number) => z.coerce.number().int().min(min).max(max);
const offerId = z.coerce.number().int().positive();

const travellers = {
  adults: int(1, 30),
  children: int(0, 20).default(0),
  infants: int(0, 10).default(0),
};

export const addToCartSchema = z.discriminatedUnion('offerType', [
  z.object({
    offerType: z.literal('accommodation'),
    offerId,
    startDate: isoDate,
    endDate: isoDate,
    ...travellers,
  }),
  z.object({ offerType: z.literal('stay'), offerId, startDate: isoDate, ...travellers }),
  z.object({
    offerType: z.enum(['experience', 'table']),
    offerId,
    date: isoDate,
    slot: hhmm,
    ...travellers,
  }),
  z.object({
    offerType: z.literal('transfer'),
    offerId,
    direction: z.enum(['outbound', 'return', 'both']),
    outboundDate: isoDate,
    outboundTime: hhmm,
    returnDate: isoDate.optional(),
    returnTime: hhmm.optional(),
    passengers: int(1, 40),
  }),
]);

export type AddToCartInput = z.infer<typeof addToCartSchema>;

export const lineIdSchema = z.string().regex(/^[a-z0-9]{8,32}$/);

export const updateTravellersSchema = z.object({ lineId: lineIdSchema, ...travellers });

/** FormData → objet simple (les champs vides deviennent absents). */
export const formEntries = (formData: FormData): Record<string, string> => {
  const entries: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string' && value.trim() !== '') entries[key] = value.trim();
  }
  return entries;
};
