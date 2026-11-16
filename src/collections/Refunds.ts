import { APIError, type CollectionBeforeChangeHook, type CollectionConfig } from 'payload';
import { isAdmin, isBackOffice, isOperations, roleOf } from '@/access';
import { amountField } from '@/fields/checkout';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isEmpty = (value: unknown): boolean =>
  value === null || value === undefined || (typeof value === 'string' && value.trim() === '');

/**
 * Règles métier (FR-027 à FR-029) : montant = somme des lignes ; montant inférieur au calcul des
 * paliers seulement avec un motif ; autre moyen que l'original seulement avec justification ;
 * refus motivé ; validation et versement réservés à la finance.
 */
export const guardRefund: CollectionBeforeChangeHook = ({ data, originalDoc, req, operation }) => {
  if (!isRecord(data)) return data;
  const merged: Record<string, unknown> = {
    ...(isRecord(originalDoc) ? originalDoc : {}),
    ...data,
  };
  const fail = (message: string): never => {
    throw new APIError(message, 400, undefined, true);
  };
  const lines = Array.isArray(merged.lines) ? merged.lines.filter(isRecord) : [];
  const sum = lines.reduce(
    (total, line) => total + (typeof line.amount === 'number' ? line.amount : 0),
    0,
  );
  if (lines.length > 0 && sum !== merged.amount)
    fail('Le montant doit égaler la somme des lignes.');
  const amount = typeof merged.amount === 'number' ? merged.amount : 0;
  const calculated = typeof merged.calculatedAmount === 'number' ? merged.calculatedAmount : 0;
  if (amount < calculated && isEmpty(merged.adjustmentReason))
    fail('Montant inférieur au calcul des paliers : motif obligatoire.');
  if (merged.method !== 'original' && isEmpty(merged.methodJustification))
    fail('Moyen de remboursement différent de l’original : justification obligatoire.');
  if (merged.status === 'rejected' && isEmpty(merged.rejectionReason))
    fail('Refus : motif obligatoire.');
  const previous: unknown = operation === 'update' ? originalDoc?.status : 'requested';
  const next: unknown = merged.status;
  const role = req.user ? roleOf(req) : 'admin';
  if (
    next !== previous &&
    (next === 'approved' || next === 'paid') &&
    role !== 'finance' &&
    role !== 'admin'
  )
    fail('Seule la finance valide ou marque versé un remboursement.');
  return data;
};

// Remboursements (002, T025) : demandés par les opérations, validés puis versés par la finance ;
// suivi du délai `paidAt − approvedAt ≤ 14 jours` (alerte à J+10).
export const Refunds: CollectionConfig = {
  slug: 'refunds',
  labels: { singular: 'Remboursement', plural: 'Remboursements' },
  admin: {
    group: 'Ventes',
    defaultColumns: ['booking', 'amount', 'reason', 'status', 'createdAt'],
  },
  access: { read: isBackOffice, create: isOperations, update: isBackOffice, delete: isAdmin },
  hooks: { beforeChange: [guardRefund] },
  fields: [
    {
      name: 'booking',
      type: 'relationship',
      relationTo: 'bookings',
      required: true,
      index: true,
      label: 'Réservation',
    },
    {
      name: 'lines',
      type: 'array',
      label: 'Lignes remboursées',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'lineId', type: 'text', required: true, label: 'Ligne' },
            amountField('amount', 'Montant'),
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        amountField('amount', 'Montant remboursé'),
        {
          ...amountField('calculatedAmount', 'Montant selon les paliers'),
          admin: { readOnly: true },
        },
      ],
    },
    { name: 'adjustmentReason', type: 'textarea', label: 'Motif d’un montant inférieur au calcul' },
    {
      name: 'reason',
      type: 'select',
      required: true,
      label: 'Motif',
      options: [
        { label: 'Annulation du voyageur', value: 'traveller' },
        { label: 'Du fait de l’agence', value: 'company' },
        { label: 'Du fait du prestataire', value: 'partner' },
        { label: 'Prestation indisponible', value: 'unavailable' },
      ],
    },
    {
      name: 'method',
      type: 'select',
      required: true,
      defaultValue: 'original',
      label: 'Moyen',
      options: [
        { label: 'Moyen de paiement d’origine', value: 'original' },
        { label: 'Wave', value: 'wave' },
        { label: 'Orange Money', value: 'orange_money' },
        { label: 'Virement bancaire', value: 'bank_transfer' },
      ],
    },
    { name: 'methodJustification', type: 'textarea', label: 'Justification du moyen' },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'requested',
      index: true,
      label: 'Statut',
      options: [
        { label: 'Demandé', value: 'requested' },
        { label: 'Validé', value: 'approved' },
        { label: 'Versé', value: 'paid' },
        { label: 'Refusé', value: 'rejected' },
      ],
    },
    { name: 'rejectionReason', type: 'textarea', label: 'Motif du refus' },
    { name: 'gatewayRefundReference', type: 'text', label: 'Référence de remboursement' },
    { name: 'requestedBy', type: 'relationship', relationTo: 'users', label: 'Demandé par' },
    { name: 'approvedBy', type: 'relationship', relationTo: 'users', label: 'Validé par' },
    {
      type: 'row',
      fields: [
        { name: 'approvedAt', type: 'date', label: 'Validé le' },
        { name: 'paidAt', type: 'date', label: 'Versé le' },
      ],
    },
  ],
};
