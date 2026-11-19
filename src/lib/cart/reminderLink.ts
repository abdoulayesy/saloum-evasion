import { createHmac, timingSafeEqual } from 'node:crypto';

// Liens des relances de panier (002, US3, T079 ; contrat routes-tunnel « Reprise après
// relance ») : jeton signé, sans stockage, `objet.panier.expiration.source.signature`.
// - `resume` : restaure le panier, valable 7 jours ;
// - `unsubscribe` : désinscription des relances, valable 90 jours.
// La source (`e1`, `w2`… canal + rang de la relance, `team` pour un lien renvoyé par l'équipe)
// sert à noter l'ouverture du lien et à mesurer `payment_recovered` (T081).

export type ReminderLinkPurpose = 'resume' | 'unsubscribe';

export type ReminderSource =
  { kind: 'reminder'; channel: 'email' | 'whatsapp'; rank: 1 | 2 } | { kind: 'team' };

const TTL_DAYS: Record<ReminderLinkPurpose, number> = { resume: 7, unsubscribe: 90 };
const DAY_SECONDS = 24 * 60 * 60;
const SIGNATURE_LENGTH = 32;

const signingKey = (): Buffer => {
  const secret = process.env.PAYLOAD_SECRET;
  if (!secret) throw new Error('PAYLOAD_SECRET manquant : lien de relance impossible.');
  return createHmac('sha256', secret).update('saloum-evasion/cart-reminder-link').digest();
};

const sign = (body: string): string =>
  createHmac('sha256', signingKey()).update(body).digest('base64url').slice(0, SIGNATURE_LENGTH);

const encodeSource = (source: ReminderSource): string =>
  source.kind === 'team' ? 'team' : `${source.channel === 'email' ? 'e' : 'w'}${source.rank}`;

const decodeSource = (value: string): ReminderSource | null => {
  if (value === 'team') return { kind: 'team' };
  const match = /^([ew])([12])$/.exec(value);
  if (!match) return null;
  return {
    kind: 'reminder',
    channel: match[1] === 'e' ? 'email' : 'whatsapp',
    rank: match[2] === '1' ? 1 : 2,
  };
};

export const createReminderLinkToken = (
  purpose: ReminderLinkPurpose,
  cartId: number,
  source: ReminderSource,
  now: Date = new Date(),
): string => {
  const expires = Math.floor(now.getTime() / 1000) + TTL_DAYS[purpose] * DAY_SECONDS;
  const body = `${purpose}.${cartId}.${expires}.${encodeSource(source)}`;
  return `${body}.${sign(body)}`;
};

export type VerifiedReminderLink = { cartId: number; source: ReminderSource };

/** Jeton valide pour cet objet et non expiré, sinon `null`. */
export const verifyReminderLinkToken = (
  token: string,
  purpose: ReminderLinkPurpose,
  now: Date = new Date(),
): VerifiedReminderLink | null => {
  const parts = token.split('.');
  if (parts.length !== 5) return null;
  const [tokenPurpose = '', cart = '', expires = '', sourceCode = '', signature = ''] = parts;
  const expected = Buffer.from(sign(parts.slice(0, 4).join('.')));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  if (tokenPurpose !== purpose) return null;
  const cartId = Number(cart);
  const expiresAt = Number(expires);
  if (!Number.isInteger(cartId) || cartId <= 0 || !Number.isInteger(expiresAt)) return null;
  if (expiresAt * 1000 < now.getTime()) return null;
  const source = decodeSource(sourceCode);
  return source ? { cartId, source } : null;
};
