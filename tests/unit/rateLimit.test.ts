import { describe, expect, it } from 'vitest';
import {
  clientIp,
  consumeRateLimit,
  hashIp,
  windowStart,
  type RateLimitStore,
} from '@/lib/request/rateLimit';

const memoryStore = (): RateLimitStore & { rows: Map<string, number> } => {
  const rows = new Map<string, number>();
  const key = (hash: string, start: Date) => `${hash}|${start.toISOString()}`;
  return {
    rows,
    find: async (hash, start) => {
      const count = rows.get(key(hash, start));
      return count === undefined ? null : { id: key(hash, start), count };
    },
    create: async (hash, start) => {
      rows.set(key(hash, start), 1);
    },
    increment: async (id, count) => {
      rows.set(String(id), count);
    },
  };
};

describe('limitation de débit du formulaire', () => {
  it('empreinte salée, jamais l’IP en clair', () => {
    const hash = hashIp('196.207.10.1', 'sel');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toContain('196');
    expect(hashIp('196.207.10.1', 'autre-sel')).not.toBe(hash);
  });

  it('fenêtre d’une heure', () => {
    expect(windowStart(new Date('2026-11-15T10:42:13Z')).toISOString()).toBe(
      '2026-11-15T10:00:00.000Z',
    );
  });

  it('5 demandes par heure, la 6e refusée, nouvelle fenêtre ensuite', async () => {
    const store = memoryStore();
    const now = new Date('2026-11-15T10:05:00Z');
    const results = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
      results.push(await consumeRateLimit(store, 'h', now));
    }
    expect(results).toEqual([true, true, true, true, true, false]);
    expect(await consumeRateLimit(store, 'h', new Date('2026-11-15T11:01:00Z'))).toBe(true);
    expect(await consumeRateLimit(store, 'autre', now)).toBe(true);
  });

  it('IP du client derrière le proxy', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '41.82.1.2, 10.0.0.1' }))).toBe('41.82.1.2');
    expect(clientIp(new Headers({ 'x-real-ip': '41.82.1.3' }))).toBe('41.82.1.3');
    expect(clientIp(new Headers())).toBe('unknown');
  });
});
