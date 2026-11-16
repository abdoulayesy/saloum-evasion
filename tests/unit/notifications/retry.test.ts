import { describe, expect, it } from 'vitest';
import { MAX_ATTEMPTS, nextStep } from '@/lib/notifications/retry';
import { templateRequestBody } from '@/lib/notifications/whatsapp';

// T034 (FR-023) : 4 tentatives à 0, 1, 5 et 30 minutes, puis escalade.
describe('politique d’envoi des notifications', () => {
  it('relances à 1, 5 puis 30 minutes après chaque échec', () => {
    expect(MAX_ATTEMPTS).toBe(4);
    expect(nextStep(1)).toEqual({ action: 'retry', delayMs: 60_000 });
    expect(nextStep(2)).toEqual({ action: 'retry', delayMs: 5 * 60_000 });
    expect(nextStep(3)).toEqual({ action: 'retry', delayMs: 30 * 60_000 });
  });

  it('escalade après la 4e tentative échouée', () => {
    expect(nextStep(4)).toEqual({ action: 'escalate' });
    expect(nextStep(5)).toEqual({ action: 'escalate' });
  });

  it('message modèle WhatsApp : numéro sans « + », langue et variables dans l’ordre', () => {
    expect(
      templateRequestBody('+221771234567', {
        name: 'booking_confirmed',
        locale: 'fr',
        params: ['Awa', 'SE-7KD3QP'],
      }),
    ).toEqual({
      messaging_product: 'whatsapp',
      to: '221771234567',
      type: 'template',
      template: {
        name: 'booking_confirmed',
        language: { code: 'fr' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: 'Awa' },
              { type: 'text', text: 'SE-7KD3QP' },
            ],
          },
        ],
      },
    });
  });
});
