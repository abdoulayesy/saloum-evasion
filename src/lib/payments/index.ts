import { checkoutEnv } from '@/lib/env';
import { createFakeGateway, type FakeGateway } from './fake';
import type { PaymentGateway } from './gateway';

// Sélection de la passerelle par `PAYMENT_GATEWAY` (002, T029). Module serveur. L'agrégateur réel
// (PayDunya, PayTech ou CinetPay) sera branché ici par T098, après la décision T097.

const siteUrl = (): string => process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

let fake: FakeGateway | null = null;

export const getFakeGateway = (): FakeGateway => {
  const env = checkoutEnv();
  if (env.PAYMENT_GATEWAY !== 'fake' || !env.FAKE_GATEWAY_SECRET) {
    throw new Error('La passerelle factice n’est pas active (PAYMENT_GATEWAY ≠ fake).');
  }
  fake ??= createFakeGateway({ secret: env.FAKE_GATEWAY_SECRET, baseUrl: siteUrl() });
  return fake;
};

export const getPaymentGateway = (): PaymentGateway => {
  const { PAYMENT_GATEWAY } = checkoutEnv();
  if (PAYMENT_GATEWAY === 'fake') return getFakeGateway();
  throw new Error(`Passerelle « ${PAYMENT_GATEWAY} » non implémentée (décision T097, puis T098).`);
};

export type { PaymentGateway } from './gateway';
