import { describe, expect, it } from 'vitest';
import en from '@/i18n/messages/en.json';
import fr from '@/i18n/messages/fr.json';

// T160 : FR et EN ont exactement les mêmes clés de traduction, et aucune valeur vide.
const keysOf = (value: unknown, prefix = ''): string[] => {
  if (typeof value !== 'object' || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keysOf(child, prefix ? `${prefix}.${key}` : key),
  );
};

const emptyKeys = (value: unknown, prefix = ''): string[] => {
  if (typeof value === 'string') return value.trim() === '' ? [prefix] : [];
  if (typeof value !== 'object' || value === null) return [];
  return Object.entries(value).flatMap(([key, child]) =>
    emptyKeys(child, prefix ? `${prefix}.${key}` : key),
  );
};

describe('messages d’interface', () => {
  it('FR et EN ont les mêmes clés', () => {
    const frKeys = keysOf(fr).sort();
    const enKeys = keysOf(en).sort();
    expect(
      enKeys.filter((key) => !frKeys.includes(key)),
      'clés EN absentes en FR',
    ).toEqual([]);
    expect(
      frKeys.filter((key) => !enKeys.includes(key)),
      'clés FR absentes en EN',
    ).toEqual([]);
  });

  it('aucune traduction vide', () => {
    expect(emptyKeys(fr)).toEqual([]);
    expect(emptyKeys(en)).toEqual([]);
  });
});
