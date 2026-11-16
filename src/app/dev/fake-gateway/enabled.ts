// La page simulée n'existe qu'avec la passerelle factice, et jamais en production (sauf
// `ALLOW_FAKE_GATEWAY=1`, réservé aux recettes sur une préproduction).
export const isFakeGatewayEnabled = (): boolean =>
  process.env.PAYMENT_GATEWAY === 'fake' &&
  (process.env.NODE_ENV !== 'production' || process.env.ALLOW_FAKE_GATEWAY === '1');
