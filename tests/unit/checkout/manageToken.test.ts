import { beforeAll, describe, expect, it } from 'vitest';
import { currentManageToken, hashManageToken, manageTokenFor } from '@/lib/booking/access';

// Jeton de gestion dérivé (research R13, US2) : stable pour une réservation et une version,
// distinct d'une réservation à l'autre, retrouvé depuis la seule empreinte stockée.

const booking = { id: 12, reference: 'SE-7KD3QP' };

describe('jeton de gestion dérivé', () => {
  beforeAll(() => {
    process.env.PAYLOAD_SECRET ??= 'secret-de-test-unitaire-0123456789';
  });

  it('stable, 32 octets en base64url, empreinte SHA-256', () => {
    const first = manageTokenFor(booking);
    expect(manageTokenFor(booking)).toEqual(first);
    expect(first.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(first.hash).toBe(hashManageToken(first.token));
  });

  it('distinct selon la réservation et la version', () => {
    const first = manageTokenFor(booking).token;
    expect(manageTokenFor({ id: 13, reference: 'SE-7KD3QP' }).token).not.toBe(first);
    expect(manageTokenFor({ id: 12, reference: 'SE-7KD3QR' }).token).not.toBe(first);
    expect(manageTokenFor(booking, 2).token).not.toBe(first);
  });

  it('jeton en vigueur retrouvé depuis l’empreinte ; aucun si révoqué', () => {
    const second = manageTokenFor(booking, 2);
    expect(currentManageToken({ ...booking, manageTokenHash: second.hash })).toBe(second.token);
    expect(currentManageToken({ ...booking, manageTokenHash: null })).toBeNull();
    expect(currentManageToken({ ...booking, manageTokenHash: 'f'.repeat(64) })).toBeNull();
  });
});
