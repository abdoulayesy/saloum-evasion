import { describe, expect, it } from 'vitest';
import { durationBucket } from '@/lib/checkout/funnel';

// T106 (FR-040, SC-001) : durée du parcours par tranche, autour de l'objectif de 3 minutes.
describe('tranche de durée du parcours', () => {
  it('bornes basses incluses, hautes exclues', () => {
    expect(durationBucket(0)).toBe('< 1 min');
    expect(durationBucket(59)).toBe('< 1 min');
    expect(durationBucket(60)).toBe('1–3 min');
    expect(durationBucket(179)).toBe('1–3 min');
    expect(durationBucket(180)).toBe('3–5 min');
    expect(durationBucket(599)).toBe('5–10 min');
    expect(durationBucket(1799)).toBe('10–30 min');
    expect(durationBucket(1800)).toBe('≥ 30 min');
    expect(durationBucket(86_400)).toBe('≥ 30 min');
  });
});
