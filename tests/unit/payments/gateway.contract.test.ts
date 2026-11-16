import { describe, expect, it } from 'vitest';
import { createFakeGateway, FAKE_SIGNATURE_HEADER, type FakeGateway } from '@/lib/payments/fake';
import type { CreateCheckoutInput, PaymentGateway, PaymentMethod } from '@/lib/payments/gateway';

// T030 : suite de contrat commune, exécutée contre chaque implémentation de `PaymentGateway`.
// Chaque implémentation fournit un moyen de produire une notification authentique (`notify`),
// propre à son format ; l'agrégateur réel rejoindra cette liste avec T098.

type Harness = {
  name: string;
  gateway: PaymentGateway;
  notify: (
    gatewayReference: string,
    outcome: 'succeeded' | 'insufficient_funds',
  ) => {
    body: string;
    headers: Headers;
  };
};

const fakeHarness = (): Harness => {
  const gateway: FakeGateway = createFakeGateway({
    secret: 'test-secret',
    baseUrl: 'http://localhost:3000',
  });
  return {
    name: 'fake',
    gateway,
    notify: (gatewayReference, outcome) => {
      const signed = gateway.simulate(gatewayReference, outcome);
      if (!signed) throw new Error('tentative inconnue');
      return { body: signed.body, headers: new Headers(signed.headers) };
    },
  };
};

const input = (overrides: Partial<CreateCheckoutInput> = {}): CreateCheckoutInput => ({
  idempotencyKey: crypto.randomUUID(),
  amountXof: 146_300,
  method: 'wave',
  bookingReference: 'SE-7KD3QP',
  description: 'Saloum Évasion — séjour SE-7KD3QP (acompte)',
  customer: {
    firstName: 'Awa',
    lastName: 'Diop',
    email: 'awa@example.sn',
    phoneE164: '+221771234567',
  },
  locale: 'fr',
  returnUrl: 'http://localhost:3000/fr/commande/statut?p=1',
  cancelUrl: 'http://localhost:3000/fr/commande/statut?p=1&cancelled=1',
  notifyUrl: 'http://localhost:3000/api/payments/notify/fake',
  ...overrides,
});

const checkout = async (gateway: PaymentGateway, overrides: Partial<CreateCheckoutInput> = {}) => {
  const result = await gateway.createCheckout(input(overrides));
  if (!result.ok) throw new Error(`création refusée : ${result.reason}`);
  return result;
};

describe.each([fakeHarness()])('contrat PaymentGateway — $name', ({ gateway, notify }) => {
  it('trois moyens supportés, au même rang et dans l’ordre Wave / Orange Money / Carte', () => {
    const expected: PaymentMethod[] = ['wave', 'orange_money', 'card'];
    expect([...gateway.supportedMethods]).toEqual(expected);
  });

  it.each(['wave', 'orange_money', 'card'] as const)(
    'création d’un paiement %s : page hébergée et expiration',
    async (method) => {
      const result = await checkout(gateway, { method });
      expect(result.redirectUrl).toMatch(/^https?:\/\//);
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(await gateway.getStatus(result.gatewayReference)).toEqual({ status: 'pending' });
    },
  );

  it('montant non entier ou nul refusé', async () => {
    expect(await gateway.createCheckout(input({ amountXof: 1000.5 }))).toEqual({
      ok: false,
      reason: 'invalid_request',
    });
    expect(await gateway.createCheckout(input({ amountXof: 0 }))).toEqual({
      ok: false,
      reason: 'invalid_request',
    });
  });

  it('notification authentique : montant entier conservé et statut reconnu', async () => {
    const { gatewayReference } = await checkout(gateway);
    const { body, headers } = notify(gatewayReference, 'succeeded');
    const verified = await gateway.verifyNotification(body, headers);
    expect(verified?.gatewayReference).toBe(gatewayReference);
    expect(verified?.result).toMatchObject({ status: 'succeeded', amountXof: 146_300 });
    expect(await gateway.getStatus(gatewayReference)).toMatchObject({
      status: 'succeeded',
      amountXof: 146_300,
    });
  });

  it('échec : cause reconnue', async () => {
    const { gatewayReference } = await checkout(gateway);
    const { body, headers } = notify(gatewayReference, 'insufficient_funds');
    expect((await gateway.verifyNotification(body, headers))?.result).toEqual({
      status: 'failed',
      reason: 'insufficient_funds',
    });
  });

  it('signature invalide ou corps altéré rejetés', async () => {
    const { gatewayReference } = await checkout(gateway);
    const { body, headers } = notify(gatewayReference, 'succeeded');
    expect(await gateway.verifyNotification(body.replace('146300', '1'), headers)).toBeNull();
    const forged = new Headers(headers);
    forged.set(FAKE_SIGNATURE_HEADER, '0'.repeat(64));
    expect(await gateway.verifyNotification(body, forged)).toBeNull();
    expect(await gateway.verifyNotification(body, new Headers())).toBeNull();
  });

  it('notification rejouée : même identifiant d’évènement (dédoublonnée par paymentEvents)', async () => {
    const { gatewayReference } = await checkout(gateway);
    const { body, headers } = notify(gatewayReference, 'succeeded');
    const first = await gateway.verifyNotification(body, headers);
    const replay = await gateway.verifyNotification(body, headers);
    expect(replay?.gatewayEventId).toBe(first?.gatewayEventId);
  });
});
