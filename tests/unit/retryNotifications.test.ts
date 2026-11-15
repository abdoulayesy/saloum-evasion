import { describe, expect, it } from 'vitest';
import { ALERTED_ATTEMPTS, MAX_NOTIFY_ATTEMPTS, retryAction } from '@/jobs/retryPolicy';

describe('relance des notifications de demandes', () => {
  it('ne touche pas une demande déjà notifiée', () => {
    expect(retryAction({ notifiedAt: '2026-11-15T10:00:00Z', notifyAttempts: 1 })).toBe('skip');
  });

  it('relance tant que moins de 3 essais', () => {
    expect(retryAction({ notifiedAt: null, notifyAttempts: 0 })).toBe('retry');
    expect(retryAction({ notifiedAt: null, notifyAttempts: 2 })).toBe('retry');
    expect(retryAction({ notifyAttempts: null })).toBe('retry');
  });

  it('alerte une seule fois après 3 essais, puis plus rien', () => {
    expect(retryAction({ notifiedAt: null, notifyAttempts: MAX_NOTIFY_ATTEMPTS })).toBe('alert');
    expect(retryAction({ notifiedAt: null, notifyAttempts: ALERTED_ATTEMPTS })).toBe('skip');
  });
});
