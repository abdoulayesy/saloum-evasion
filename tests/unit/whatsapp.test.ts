import { describe, expect, it } from 'vitest';
import { buildWhatsAppLink, toWaNumber } from '@/lib/whatsapp';

describe('liens WhatsApp', () => {
  it('numéro E.164 → chiffres seuls, message encodé', () => {
    expect(toWaNumber('+221 77 123 45 67')).toBe('221771234567');
    expect(
      buildWhatsAppLink({
        number: '+221771234567',
        message: 'Bonjour, « Week-end » : https://x.test/fr',
      }),
    ).toBe(
      'https://wa.me/221771234567?text=Bonjour%2C%20%C2%AB%20Week-end%20%C2%BB%20%3A%20https%3A%2F%2Fx.test%2Ffr',
    );
  });
  it('sans numéro valide : aucun lien (jamais de numéro inventé)', () => {
    expect(buildWhatsAppLink({ number: undefined, message: 'x' })).toBeNull();
    expect(buildWhatsAppLink({ number: '+22177', message: 'x' })).toBeNull();
  });
});
