import { z } from 'zod';
import { E164_PATTERN } from '@/fields/validators';
import { normalizeWhatsapp } from '@/lib/request/schema';

// Coordonnées du voyageur (002, T052 ; contrat checkout-actions « submitContactDetails »).
// Module partagé serveur/tests ; les messages sont des codes traduits par la page.

export const CONTACT_FIELDS = [
  'firstName',
  'lastName',
  'whatsapp',
  'email',
  'specialRequest',
  'consentProcessing',
] as const;

export type ContactField = (typeof CONTACT_FIELDS)[number];

export type ContactErrorCode = 'required' | 'email' | 'phone' | 'consent' | 'tooLong';

const contactSchema = z.object({
  firstName: z.string().trim().min(1, 'required').max(60, 'tooLong'),
  lastName: z.string().trim().min(1, 'required').max(60, 'tooLong'),
  whatsapp: z.string().regex(E164_PATTERN, 'phone'),
  email: z.string().trim().min(1, 'required').max(254, 'tooLong').pipe(z.email('email')),
  specialRequest: z.string().trim().max(1000, 'tooLong').optional(),
  consentProcessing: z.literal('on', { error: 'consent' }),
  consentReminders: z.literal('on').optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

const ERROR_CODES: ReadonlySet<string> = new Set([
  'required',
  'email',
  'phone',
  'consent',
  'tooLong',
]);

const isErrorCode = (value: string): value is ContactErrorCode => ERROR_CODES.has(value);

const isContactField = (value: unknown): value is ContactField =>
  CONTACT_FIELDS.some((field) => field === value);

/** Valeurs brutes du formulaire, réaffichées après une erreur (jamais de consentement prérempli). */
export type ContactValues = Partial<
  Record<
    'firstName' | 'lastName' | 'dialCode' | 'whatsappLocal' | 'email' | 'specialRequest',
    string
  >
>;

export type ContactResult =
  | {
      status: 'invalid';
      errors: Partial<Record<ContactField, ContactErrorCode>>;
      values: ContactValues;
    }
  | { status: 'rate_limited'; values: ContactValues }
  | { status: 'conflict' }
  | { status: 'error' };

export const parseContact = (
  raw: Record<string, string>,
):
  | { ok: true; data: ContactInput }
  | { ok: false; errors: Partial<Record<ContactField, ContactErrorCode>> } => {
  const whatsapp = raw.whatsappLocal
    ? normalizeWhatsapp(raw.dialCode ?? '+221', raw.whatsappLocal)
    : '';
  const result = contactSchema.safeParse({ ...raw, whatsapp });
  if (result.success) return { ok: true, data: result.data };
  const errors: Partial<Record<ContactField, ContactErrorCode>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (!isContactField(field) || errors[field]) continue;
    errors[field] = isErrorCode(issue.message) ? issue.message : 'required';
  }
  return { ok: false, errors };
};
