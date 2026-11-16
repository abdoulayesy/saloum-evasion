import { describe, expect, it } from 'vitest';
import {
  generateBookingReference,
  isBookingReference,
  REFERENCE_ALPHABET,
} from '@/lib/checkout/reference';

// T016 : référence `SE-` + 6 caractères sans 0/O/1/I, unicité statistique.
describe('référence de réservation', () => {
  it('alphabet de 32 caractères sans caractère ambigu', () => {
    expect(REFERENCE_ALPHABET).toHaveLength(32);
    expect(new Set(REFERENCE_ALPHABET).size).toBe(32);
    expect(REFERENCE_ALPHABET).not.toMatch(/[0O1I]/);
  });

  it('format conforme au motif du tunnel', () => {
    for (let index = 0; index < 200; index += 1) {
      expect(isBookingReference(generateBookingReference())).toBe(true);
    }
    expect(isBookingReference('SE-AB0CDE')).toBe(false);
    expect(generateBookingReference(() => 0)).toBe('SE-AAAAAA');
  });

  it('unicité statistique sur 10 000 tirages', () => {
    const references = new Set(Array.from({ length: 10_000 }, () => generateBookingReference()));
    // Probabilité d'au moins une collision ≈ 4,7 % (paradoxe des anniversaires) : on tolère 2.
    expect(references.size).toBeGreaterThanOrEqual(9_998);
  });
});
