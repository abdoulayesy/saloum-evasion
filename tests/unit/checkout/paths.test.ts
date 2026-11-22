import { describe, expect, it } from 'vitest';
import {
  checkoutPath,
  internalCheckoutPath,
  parseCheckoutPath,
  type CheckoutStep,
} from '@/lib/checkout/paths';

// T003 : URL traduites du tunnel, aller-retour avec l'analyse du chemin.
const STEPS: readonly [CheckoutStep, string | undefined, string, string][] = [
  ['compose', undefined, '/fr/composer', '/en/compose'],
  ['cart', undefined, '/fr/panier', '/en/cart'],
  ['resume', undefined, '/fr/panier/reprendre', '/en/cart/resume'],
  ['unsubscribe', undefined, '/fr/panier/desinscription', '/en/cart/unsubscribe'],
  ['details', undefined, '/fr/commande/coordonnees', '/en/checkout/details'],
  ['payment', undefined, '/fr/commande/paiement', '/en/checkout/payment'],
  ['status', undefined, '/fr/commande/statut', '/en/checkout/status'],
  ['find', undefined, '/fr/reservation/retrouver', '/en/booking/find'],
  ['booking', 'SE-AB23CD', '/fr/reservation/se-ab23cd', '/en/booking/se-ab23cd'],
  ['balance', 'SE-AB23CD', '/fr/reservation/se-ab23cd/solde', '/en/booking/se-ab23cd/balance'],
  ['cancel', 'SE-AB23CD', '/fr/reservation/se-ab23cd/annulation', '/en/booking/se-ab23cd/cancel'],
];

describe('chemins du tunnel', () => {
  it.each(STEPS)('%s : URL FR et EN, analyse réciproque', (step, ref, fr, en) => {
    expect(checkoutPath('fr', step, ref)).toBe(fr);
    expect(checkoutPath('en', step, ref)).toBe(en);
    expect(parseCheckoutPath(fr)).toEqual({ locale: 'fr', route: ref ? { step, ref } : { step } });
    expect(parseCheckoutPath(en)).toEqual({ locale: 'en', route: ref ? { step, ref } : { step } });
  });

  it('chemins internes', () => {
    expect(internalCheckoutPath('fr', 'details')).toBe('/fr/tunnel/checkout/details');
    expect(internalCheckoutPath('en', 'cancel', 'SE-AB23CD')).toBe(
      '/en/tunnel/booking/SE-AB23CD/cancel',
    );
  });

  it('refuse les chemins inconnus ou mal formés', () => {
    expect(parseCheckoutPath('/fr/cart')).toBeNull();
    expect(parseCheckoutPath('/en/panier')).toBeNull();
    expect(parseCheckoutPath('/fr/reservation/SE-ABC')).toBeNull();
    expect(parseCheckoutPath('/fr/reservation/se-ab0cd1')).toBeNull();
    expect(parseCheckoutPath('/fr/reservation/SE-AB23CD')).toBeNull();
    expect(parseCheckoutPath('/fr/commande')).toBeNull();
    expect(parseCheckoutPath('/fr/sejours')).toBeNull();
    expect(parseCheckoutPath('/fr/panier/x/y')).toBeNull();
  });
});
