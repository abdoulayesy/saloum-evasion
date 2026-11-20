import { beforeAll, describe, expect, it } from 'vitest';
import { createReminderLinkToken, verifyReminderLinkToken } from '@/lib/cart/reminderLink';

// Liens de relance signés (US3, T079) : reprise valable 7 jours, désinscription 90 jours,
// signature et objet vérifiés, source conservée pour la mesure de récupération (T081).

const NOW = new Date('2027-01-10T12:00:00Z');
const inDays = (days: number) => new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000);

describe('liens de relance', () => {
  beforeAll(() => {
    process.env.PAYLOAD_SECRET ??= 'secret-de-test-unitaire-0123456789';
  });

  it('reprise : cart et source retrouvés, valable 7 jours', () => {
    const token = createReminderLinkToken(
      'resume',
      42,
      { kind: 'reminder', channel: 'whatsapp', rank: 2 },
      NOW,
    );
    expect(verifyReminderLinkToken(token, 'resume', inDays(6))).toEqual({
      cartId: 42,
      source: { kind: 'reminder', channel: 'whatsapp', rank: 2 },
    });
    expect(verifyReminderLinkToken(token, 'resume', inDays(8))).toBeNull();
  });

  it('désinscription valable 90 jours, jamais utilisable comme reprise', () => {
    const token = createReminderLinkToken('unsubscribe', 42, { kind: 'team' }, NOW);
    expect(verifyReminderLinkToken(token, 'unsubscribe', inDays(80))).toMatchObject({ cartId: 42 });
    expect(verifyReminderLinkToken(token, 'resume', NOW)).toBeNull();
  });

  it('jeton modifié ou mal formé : refusé', () => {
    const token = createReminderLinkToken(
      'resume',
      42,
      { kind: 'reminder', channel: 'email', rank: 1 },
      NOW,
    );
    expect(verifyReminderLinkToken(token.replace('.42.', '.43.'), 'resume', NOW)).toBeNull();
    expect(verifyReminderLinkToken(`${token}x`, 'resume', NOW)).toBeNull();
    expect(verifyReminderLinkToken('n.importe.quoi', 'resume', NOW)).toBeNull();
  });
});
