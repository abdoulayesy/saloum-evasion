import { describe, expect, it } from 'vitest';
import { parseCheckoutEnv } from '@/lib/env';

// T002 : variables du tunnel validées ; passerelle factice interdite en production.
describe('variables d’environnement du tunnel', () => {
  it('valeurs par défaut et champs vides normalisés', () => {
    const env = parseCheckoutEnv({ FAKE_GATEWAY_SECRET: 'secret', WHATSAPP_CLOUD_TOKEN: '  ' });
    expect(env.PAYMENT_GATEWAY).toBe('fake');
    expect(env.WHATSAPP_CLOUD_TOKEN).toBeUndefined();
    expect(env.PLAUSIBLE_EVENTS_API).toBe('https://plausible.io/api/event');
  });

  it('passerelle factice : secret obligatoire', () => {
    expect(() => parseCheckoutEnv({})).toThrow(/FAKE_GATEWAY_SECRET/);
  });

  it('passerelle factice interdite en production', () => {
    expect(() =>
      parseCheckoutEnv({
        NODE_ENV: 'production',
        PAYMENT_GATEWAY: 'fake',
        FAKE_GATEWAY_SECRET: 's',
      }),
    ).toThrow(/interdite en production/);
    // Dérogation explicite (recette en préproduction), quelle que soit la variable du processus.
    expect(
      parseCheckoutEnv({
        NODE_ENV: 'production',
        PAYMENT_GATEWAY: 'fake',
        FAKE_GATEWAY_SECRET: 's',
        ALLOW_FAKE_GATEWAY: '1',
      }).PAYMENT_GATEWAY,
    ).toBe('fake');
    expect(
      parseCheckoutEnv({
        NODE_ENV: 'production',
        PAYMENT_GATEWAY: 'paydunya',
        PAYMENT_GATEWAY_API_KEY: 'k',
        PAYMENT_GATEWAY_WEBHOOK_SECRET: 'w',
      }).PAYMENT_GATEWAY,
    ).toBe('paydunya');
  });

  it('passerelle réelle : clé d’API et secret des notifications obligatoires (T103)', () => {
    expect(() => parseCheckoutEnv({ PAYMENT_GATEWAY: 'paydunya' })).toThrow(
      /PAYMENT_GATEWAY_API_KEY.*PAYMENT_GATEWAY_WEBHOOK_SECRET/s,
    );
  });
});
