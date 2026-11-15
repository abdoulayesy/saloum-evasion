import { describe, expect, it } from 'vitest';
import { requestRewrite } from '@/middleware';

// Phase 8 : URL publiques de la demande réécrites vers les routes internes dynamiques, isolées
// du résolveur des pages publiques ; routes internes inaccessibles directement.
describe('réécriture des URL de la demande de séjour', () => {
  it('réécrit les URL publiques FR et EN', () => {
    expect(requestRewrite('/fr/demande')).toBe('/fr/request-form');
    expect(requestRewrite('/fr/demande/merci')).toBe('/fr/request-form/thanks');
    expect(requestRewrite('/en/request')).toBe('/en/request-form');
    expect(requestRewrite('/en/request/thank-you')).toBe('/en/request-form/thanks');
  });

  it('bloque l’accès direct aux routes internes', () => {
    expect(requestRewrite('/fr/request-form')).toBe('blocked');
    expect(requestRewrite('/en/request-form/thanks')).toBe('blocked');
  });

  it('laisse passer les autres pages, y compris les traductions croisées', () => {
    expect(requestRewrite('/fr/sejours')).toBeNull();
    expect(requestRewrite('/fr/request')).toBeNull();
    expect(requestRewrite('/en/demande')).toBeNull();
    expect(requestRewrite('/es/demande')).toBeNull();
  });
});
