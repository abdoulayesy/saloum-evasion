import { describe, expect, it } from 'vitest';
import { TUNNEL_HEADERS, tunnelRewrite } from '@/middleware';

// 002 T003/T033 : URL publiques du tunnel réécrites vers les routes internes ; routes internes
// inaccessibles directement ; en-têtes noindex / no-store.
describe('réécriture du tunnel de commande', () => {
  it('réécrit les étapes FR et EN', () => {
    expect(tunnelRewrite('/fr/panier')).toBe('/fr/tunnel/cart');
    expect(tunnelRewrite('/fr/composer')).toBe('/fr/tunnel/compose');
    expect(tunnelRewrite('/en/compose')).toBe('/en/tunnel/compose');
    expect(tunnelRewrite('/en/checkout/payment')).toBe('/en/tunnel/checkout/payment');
    expect(tunnelRewrite('/fr/reservation/se-ab23cd/solde')).toBe(
      '/fr/tunnel/booking/SE-AB23CD/balance',
    );
  });

  it('bloque l’accès direct et ignore les autres pages', () => {
    expect(tunnelRewrite('/fr/tunnel/cart')).toBe('blocked');
    expect(tunnelRewrite('/fr/sejours')).toBeNull();
    expect(tunnelRewrite('/fr/demande')).toBeNull();
  });

  it('en-têtes du tunnel', () => {
    expect(TUNNEL_HEADERS).toMatchObject({
      'X-Robots-Tag': 'noindex, nofollow',
      'Cache-Control': 'private, no-store',
    });
  });
});
