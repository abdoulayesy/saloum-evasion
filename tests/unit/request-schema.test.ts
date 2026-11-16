import { describe, expect, it } from 'vitest';
import {
  buildRequestSchema,
  isLikelyBot,
  normalizeWhatsapp,
  todayDakar,
} from '@/lib/request/schema';

const NOW = new Date('2026-11-15T10:00:00Z');
const schema = buildRequestSchema(() => NOW);

const valid = {
  items: [{ kind: 'stay', slug: 'week-end-bolong-ndangane' }],
  arrivalDate: '2026-12-04',
  departureDate: '2026-12-06',
  adults: '2',
  children: '0',
  moods: ['nature'],
  budgetBand: '',
  firstName: 'Awa',
  whatsapp: '+221771234567',
  email: '',
  message: '',
  consent: 'on',
  website: '',
  startedAt: String(NOW.getTime() - 10_000),
  submissionId: '3f2b8f4e-8a7c-4d2b-9a8e-2f6f1f0c9d11',
  locale: 'fr',
  sourcePath: '/fr/sejours/week-end-bolong-ndangane',
};

const codes = (input: unknown): string[] => {
  const result = schema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
};

describe('schéma de la demande de séjour', () => {
  it('accepte une demande complète et normalise les champs facultatifs vides', () => {
    const result = schema.safeParse(valid);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.adults).toBe(2);
    expect(result.data.email).toBeUndefined();
    expect(result.data.budgetBand).toBeUndefined();
    expect(result.data.message).toBeUndefined();
  });

  it('refuse une arrivée passée (date du jour à Dakar = UTC)', () => {
    expect(todayDakar(NOW)).toBe('2026-11-15');
    expect(codes({ ...valid, arrivalDate: '2026-11-14' })).toContain('arrival_in_past');
    expect(codes({ ...valid, arrivalDate: '2026-11-15', departureDate: '' })).toEqual([]);
  });

  it('refuse un départ avant ou le jour de l’arrivée', () => {
    expect(codes({ ...valid, departureDate: '2026-12-04' })).toContain('departure_before_arrival');
    expect(codes({ ...valid, departureDate: '2026-12-01' })).toContain('departure_before_arrival');
  });

  it('exige un numéro WhatsApp E.164', () => {
    expect(codes({ ...valid, whatsapp: '771234567' })).toContain('whatsapp_invalid');
    expect(codes({ ...valid, whatsapp: '+33612345678' })).toEqual([]);
  });

  it('exige le consentement', () => {
    expect(codes({ ...valid, consent: undefined })).toContain('consent_required');
  });

  it('refuse un e-mail invalide mais accepte un e-mail vide', () => {
    expect(codes({ ...valid, email: 'pas-un-email' })).toContain('email_invalid');
    expect(codes({ ...valid, email: 'awa@example.sn' })).toEqual([]);
  });

  it('limite à 10 éléments', () => {
    const items = Array.from({ length: 11 }, (_, index) => ({
      kind: 'experience',
      slug: `e-${index}`,
    }));
    expect(codes({ ...valid, items })).toContain('too_many_items');
  });

  it('détecte les robots : pot de miel rempli ou envoi en moins de 3 s', () => {
    const now = NOW.getTime();
    expect(isLikelyBot({ website: 'http://spam', startedAt: now - 10_000 }, now)).toBe(true);
    expect(isLikelyBot({ website: '', startedAt: now - 1_000 }, now)).toBe(true);
    expect(isLikelyBot({ website: '', startedAt: now - 5_000 }, now)).toBe(false);
  });

  it('normalise le numéro avec l’indicatif choisi', () => {
    expect(normalizeWhatsapp('+221', '77 123 45 67')).toBe('+221771234567');
    expect(normalizeWhatsapp('+33', '06.12.34.56.78')).toBe('+33612345678');
    expect(normalizeWhatsapp('+221', '+221 77 123 45 67')).toBe('+221771234567');
    expect(normalizeWhatsapp('+221', '0033612345678')).toBe('+33612345678');
  });
});
