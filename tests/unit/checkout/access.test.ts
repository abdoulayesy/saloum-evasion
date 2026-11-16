import { describe, expect, it } from 'vitest';
import type { CollectionConfig, GlobalConfig } from 'payload';
import { Bookings } from '@/collections/Bookings';
import { CancellationPolicies, validateTiers } from '@/collections/CancellationPolicies';
import { Carts } from '@/collections/Carts';
import { CommissionEntries } from '@/collections/CommissionEntries';
import { maskRecipient, Notifications } from '@/collections/Notifications';
import { Partners } from '@/collections/Partners';
import { PaymentEvents } from '@/collections/PaymentEvents';
import { Payments } from '@/collections/Payments';
import { Payouts } from '@/collections/Payouts';
import { Refunds } from '@/collections/Refunds';
import { Reminders } from '@/collections/Reminders';
import { Stays } from '@/collections/Stays';
import { Transfers, validatePriceTiers } from '@/collections/Transfers';
import { CommissionRates } from '@/globals/CommissionRates';

// T027 : matrice d'accès du data-model 002 (rôles editor, operations, finance, admin). Chaque
// droit est lu sur la liste de rôles portée par la fonction d'accès.

type Operation = 'read' | 'create' | 'update' | 'delete';

const rolesOf = (access: unknown): string[] | 'custom' => {
  if (typeof access !== 'function') return 'custom';
  if (!('roles' in access) || !Array.isArray(access.roles)) return 'custom';
  return access.roles.filter((role): role is string => typeof role === 'string').sort();
};

const matrix = (config: CollectionConfig): Record<Operation, string[] | 'custom'> => ({
  read: rolesOf(config.access?.read),
  create: rolesOf(config.access?.create),
  update: rolesOf(config.access?.update),
  delete: rolesOf(config.access?.delete),
});

const globalMatrix = (config: GlobalConfig) => ({
  read: rolesOf(config.access?.read),
  update: rolesOf(config.access?.update),
});

const BACK_OFFICE = ['admin', 'finance', 'operations'];
const FINANCE = ['admin', 'finance'];
const OPERATIONS = ['admin', 'operations'];
const NOBODY: string[] = [];

describe('matrice d’accès (data-model 002)', () => {
  it('paniers : jamais créés ni modifiés hors serveur', () => {
    expect(matrix(Carts)).toEqual({
      read: BACK_OFFICE,
      create: NOBODY,
      update: NOBODY,
      delete: ['admin'],
    });
  });

  it('réservations : lecture opérations et finance, écriture opérations, création serveur', () => {
    expect(matrix(Bookings)).toEqual({
      read: BACK_OFFICE,
      create: NOBODY,
      update: OPERATIONS,
      delete: ['admin'],
    });
  });

  it('paiements et journal des notifications : aucune écriture depuis l’admin', () => {
    expect(matrix(Payments)).toEqual({
      read: BACK_OFFICE,
      create: NOBODY,
      update: NOBODY,
      delete: NOBODY,
    });
    expect(matrix(PaymentEvents)).toEqual({
      read: FINANCE,
      create: NOBODY,
      update: NOBODY,
      delete: NOBODY,
    });
  });

  it('remboursements : demandés par les opérations, validés par la finance (règle du crochet)', () => {
    expect(matrix(Refunds)).toEqual({
      read: BACK_OFFICE,
      create: OPERATIONS,
      update: BACK_OFFICE,
      delete: ['admin'],
    });
  });

  it('commissions et reversements : finance uniquement ; écritures de commission immuables', () => {
    expect(matrix(CommissionEntries)).toEqual({
      read: FINANCE,
      create: NOBODY,
      update: NOBODY,
      delete: NOBODY,
    });
    expect(matrix(Payouts)).toEqual({
      read: FINANCE,
      create: FINANCE,
      update: FINANCE,
      delete: ['admin'],
    });
    expect(globalMatrix(CommissionRates)).toEqual({
      read: ['admin', 'editor', 'finance', 'operations'],
      update: FINANCE,
    });
  });

  it('prestataires : lisibles par l’équipe, gérés par opérations et finance', () => {
    expect(matrix(Partners)).toMatchObject({
      create: BACK_OFFICE,
      update: BACK_OFFICE,
      delete: ['admin'],
    });
  });

  it('relances et journal d’envoi : écrits par le serveur seulement', () => {
    expect(matrix(Reminders)).toMatchObject({ create: NOBODY, update: NOBODY, delete: NOBODY });
    expect(matrix(Notifications)).toMatchObject({ create: NOBODY, update: NOBODY, delete: NOBODY });
  });

  it('contenus 001 et transferts : écriture réservée à l’éditorial (editor, admin)', () => {
    for (const config of [Stays, Transfers, CancellationPolicies]) {
      const { create, update, delete: remove } = matrix(config);
      expect([create, update, remove]).toEqual([
        ['admin', 'editor'],
        ['admin', 'editor'],
        ['admin', 'editor'],
      ]);
    }
  });

  it('l’éditeur n’accède à aucune donnée de vente', () => {
    for (const config of [
      Carts,
      Bookings,
      Payments,
      PaymentEvents,
      Refunds,
      CommissionEntries,
      Payouts,
    ]) {
      const access = matrix(config);
      expect(access.read).not.toContain('editor');
    }
  });
});

describe('validations des collections 002', () => {
  it('paliers d’annulation : au moins un, délais uniques, pourcentages décroissants', () => {
    expect(validateTiers([])).toMatch(/Au moins un palier/);
    expect(
      validateTiers([
        { daysBeforeArrivalMin: 14, refundPercent: 50 },
        { daysBeforeArrivalMin: 14, refundPercent: 20 },
      ]),
    ).toMatch(/même délai/);
    expect(
      validateTiers([
        { daysBeforeArrivalMin: 30, refundPercent: 50 },
        { daysBeforeArrivalMin: 7, refundPercent: 80 },
      ]),
    ).toMatch(/diminuer/);
    expect(
      validateTiers([
        { daysBeforeArrivalMin: 0, refundPercent: 0 },
        { daysBeforeArrivalMin: 30, refundPercent: 100 },
      ]),
    ).toBe(true);
  });

  it('tranches de transfert : plafonds croissants', () => {
    expect(validatePriceTiers([{ maxPassengers: 7 }, { maxPassengers: 3 }])).toMatch(/croissants/);
    expect(
      validatePriceTiers([{ maxPassengers: 3 }, { maxPassengers: 7 }, { maxPassengers: 14 }]),
    ).toBe(true);
  });

  it('destinataire masqué dans l’admin', () => {
    expect(maskRecipient('jean.diop@exemple.sn')).toBe('j***@exemple.sn');
    expect(maskRecipient('+221771234534')).toBe('+221***34');
  });
});
