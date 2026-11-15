import { z } from 'zod';
import { MAX_ITEMS, REQUEST_ITEM_KINDS } from './constants';

export { MAX_ITEMS, REQUEST_ITEM_KINDS, type RequestItemKind } from './constants';

// Schéma de validation serveur de la demande de séjour (contrat request-form.md §3, T139).
// Les messages sont des CODES (`arrival_in_past`…), traduits par next-intl : aucun message
// technique n'est montré au visiteur. Dakar est à UTC+0 : la date du jour est celle d'UTC.

export const MIN_FILL_MS = 3000;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date_invalid');

export const todayDakar = (now: Date = new Date()): string => now.toISOString().slice(0, 10);

export const requestItemSchema = z.object({
  kind: z.enum(REQUEST_ITEM_KINDS),
  /** Slug du document dans la langue de la page. */
  slug: z.string().min(1).max(120),
});

export const MOODS = [
  'nature',
  'culture',
  'gastronomie',
  'detente',
  'aventure',
  'famille',
] as const;
export const BUDGET_BANDS = ['lt250k', '250k-500k', 'gt500k'] as const;

/** Champ facultatif : chaîne vide du formulaire → absent. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, 'too_long')
    .optional()
    .transform((value) => (value ? value : undefined));

export const buildRequestSchema = (now: () => Date = () => new Date()) =>
  z
    .object({
      items: z.array(requestItemSchema).max(MAX_ITEMS, 'too_many_items').default([]),
      arrivalDate: isoDate.refine((date) => date >= todayDakar(now()), 'arrival_in_past'),
      departureDate: z
        .union([isoDate, z.literal('')])
        .optional()
        .transform((value) => (value ? value : undefined)),
      adults: z.coerce
        .number()
        .int('adults_invalid')
        .min(1, 'adults_invalid')
        .max(30, 'adults_invalid'),
      children: z.coerce.number().int().min(0).max(20).default(0),
      moods: z.array(z.enum(MOODS)).max(MOODS.length).default([]),
      budgetBand: z
        .union([z.enum(BUDGET_BANDS), z.literal('')])
        .optional()
        .transform((value) => (value ? value : undefined)),
      firstName: z.string().trim().min(1, 'first_name_required').max(60, 'too_long'),
      whatsapp: z
        .string()
        .trim()
        .regex(/^\+[1-9]\d{7,14}$/, 'whatsapp_invalid'),
      email: z
        .union([z.string().trim().email('email_invalid').max(254, 'too_long'), z.literal('')])
        .optional()
        .transform((value) => (value ? value : undefined)),
      message: optionalText(1000),
      consent: z.literal('on', { error: 'consent_required' }),
      website: z.string().max(0, 'honeypot').default(''),
      startedAt: z.coerce.number().int(),
      submissionId: z.uuid('submission_invalid'),
      locale: z.enum(['fr', 'en']),
      sourcePath: z.string().startsWith('/').max(300),
    })
    .refine((value) => !value.departureDate || value.departureDate > value.arrivalDate, {
      path: ['departureDate'],
      message: 'departure_before_arrival',
    });

export const stayRequestSchema = buildRequestSchema();

export type StayRequestInput = z.infer<typeof stayRequestSchema>;

/** Envoi automatisé probable : pot de miel rempli ou formulaire envoyé trop vite. */
export const isLikelyBot = (
  raw: { website?: string | null; startedAt?: number },
  now: number = Date.now(),
): boolean =>
  Boolean(raw.website) || typeof raw.startedAt !== 'number' || now - raw.startedAt < MIN_FILL_MS;

/** Normalise un numéro saisi (espaces, tirets, points) avec l'indicatif choisi. */
export const normalizeWhatsapp = (dialCode: string, local: string): string => {
  const digits = local.replace(/[\s.\-()]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('00')) return `+${digits.slice(2)}`;
  const code = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
  return `${code}${digits.replace(/^0+/, '')}`;
};
