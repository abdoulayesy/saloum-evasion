// Référence de réservation `SE-XXXXXX` (002, T016). Alphabet sans 0/O/1/I pour une dictée sans
// ambiguïté (téléphone, WhatsApp) ; 32^6 ≈ 1,07 milliard de combinaisons, tirage cryptographique.
// L'unicité est garantie par l'index unique de `bookings.reference` (nouveau tirage si collision).

import { randomInt } from 'node:crypto';
import { BOOKING_REFERENCE_PATTERN } from './paths';

export const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const REFERENCE_LENGTH = 6;

export const generateBookingReference = (random: (max: number) => number = randomInt): string => {
  let code = '';
  for (let index = 0; index < REFERENCE_LENGTH; index += 1) {
    code += REFERENCE_ALPHABET.charAt(random(REFERENCE_ALPHABET.length));
  }
  return `SE-${code}`;
};

export const isBookingReference = (value: string): boolean => BOOKING_REFERENCE_PATTERN.test(value);
