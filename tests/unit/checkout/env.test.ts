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
    expect(
      parseCheckoutEnv({ NODE_ENV: 'production', PAYMENT_GATEWAY: 'paydunya' }).PAYMENT_GATEWAY,
    ).toBe('paydunya');
  });
});
