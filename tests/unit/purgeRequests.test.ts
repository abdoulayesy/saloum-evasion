import { describe, expect, it } from 'vitest';
import { rateLimitCutoff, requestCutoff } from '@/jobs/purgeRequests';

describe('rétention des données', () => {
  it('demandes : 24 mois', () => {
    expect(requestCutoff(new Date('2026-11-15T10:00:00Z')).toISOString()).toBe(
      '2024-11-15T10:00:00.000Z',
    );
  });
  it('compteurs de limitation de débit : 24 h', () => {
    expect(rateLimitCutoff(new Date('2026-11-15T10:00:00Z')).toISOString()).toBe(
      '2026-11-14T10:00:00.000Z',
    );
  });
});
