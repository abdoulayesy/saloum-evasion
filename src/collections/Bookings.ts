import { APIError, type CollectionBeforeChangeHook, type CollectionConfig } from 'payload';
import { isAdmin, isAdminField, isBackOffice, isOperations, nobody } from '@/access';
import { amountField, cartLineFields, civilDateField, integerField } from '@/fields/checkout';
import { validateE164 } from '@/fields/validators';
import { notifyAvailabilityChange } from '@/hooks/availabilityUpdate';
import { stampUnavailableLines } from '@/hooks/unavailableLines';
import {
  BOOKING_STATUSES,
  canTransitionBooking,
  type BookingStatus,
} from '@/lib/checkout/stateMachines';

const isBookingStatus = (value: unknown): value is BookingStatus =>
  BOOKING_STATUSES.some((status) => status === value);

/** Toute modification de statut respecte la machine à états du data-model. */
export const guardBookingStatus: CollectionBeforeChangeHook = ({
  data,
  originalDoc,
  operation,
}) => {
  if (operation !== 'update' || !data) return data;
  const from: unknown = originalDoc?.status;
  const to: unknown = data.status;
  if (!isBookingStatus(from) || !isBookingStatus(to) || from === to) return data;
  if (!canTransitionBooking(from, to)) {
    throw new APIError(`Changement de statut refusé : ${from} → ${to}.`, 400, undefined, true);
  }
  return data;
};

const statusLabels: Record<BookingStatus, string> = {
  awaiting_payment: 'En attente de paiement',
  deposit_paid: 'Acompte payé',
  paid: 'Payée',
  expired: 'Expirée',
  cancellation_requested: 'Annulation demandée',
  cancelled: 'Annulée',
  partially_cancelled: 'Partiellement annulée',
  completed: 'Terminée',
};

/** Montants figés au paiement : jamais modifiables depuis l'admin, sauf par un administrateur. */
const readOnlyMoney = { update: isAdminField };

// Réservations (002, T023) : copie figée du panier au paiement (prix, politique d'annulation,
// taux de commission). Créées uniquement par le serveur ; les opérations confirment la
// disponibilité ligne par ligne, indépendamment du statut de paiement.
export const Bookings: CollectionConfig = {
  slug: 'bookings',
  labels: { singular: 'Réservation', plural: 'Réservations' },
  admin: {
    useAsTitle: 'reference',
    group: 'Ventes',
    defaultColumns: ['reference', 'status', 'total', 'amountPaid', 'firstArrivalDate', 'createdAt'],
  },
  access: { read: isBackOffice, create: nobody, update: isOperations, delete: isAdmin },
  indexes: [{ fields: ['cart', 'cartVersion'], unique: true }],
  hooks: {
    beforeChange: [guardBookingStatus, stampUnavailableLines],
    afterChange: [notifyAvailabilityChange],
  },
  fields: [
    {
      name: 'reference',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Référence',
      admin: { readOnly: true },
    },
    { name: 'cart', type: 'relationship', relationTo: 'carts', required: true, label: 'Panier' },
    { ...integerField('cartVersion', 'Version du panier'), admin: { readOnly: true } },
    {
      name: 'locale',
      type: 'select',
      required: true,
      label: 'Langue (notifications et bon)',
      options: [
        { label: 'Français', value: 'fr' },
        { label: 'English', value: 'en' },
      ],
    },
    {
      name: 'traveller',
      type: 'group',
      label: 'Voyageur',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'firstName', type: 'text', required: true, label: 'Prénom' },
            { name: 'lastName', type: 'text', required: true, label: 'Nom' },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'whatsapp',
              type: 'text',
              required: true,
              label: 'WhatsApp (E.164)',
              validate: validateE164,
            },
            { name: 'email', type: 'email', required: true, label: 'E-mail' },
          ],
        },
      ],
    },
    { name: 'specialRequest', type: 'textarea', maxLength: 1000, label: 'Demande particulière' },
    {
      name: 'lines',
      type: 'array',
      label: 'Prestations',
      fields: [
        ...cartLineFields,
        { name: 'title', type: 'text', required: true, label: 'Libellé figé' },
        { name: 'partner', type: 'relationship', relationTo: 'partners', label: 'Prestataire' },
        {
          type: 'row',
          fields: [
            { ...amountField('unitPrice', 'Prix unitaire'), access: readOnlyMoney },
            { ...amountField('lineTotal', 'Total de la ligne'), access: readOnlyMoney },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              ...integerField('commissionRateBp', 'Taux de commission (pb)', {
                min: 1000,
                max: 2500,
                required: false,
              }),
              access: readOnlyMoney,
            },
            {
              ...amountField('commissionAmount', 'Commission', { required: false }),
              access: readOnlyMoney,
            },
            {
              ...amountField('partnerAmount', 'Part prestataire', { required: false }),
              access: readOnlyMoney,
            },
          ],
        },
        {
          name: 'policySnapshot',
          type: 'json',
          label: 'Conditions d’annulation figées ({ name, summary, tiers })',
          access: readOnlyMoney,
        },
        {
          name: 'availabilityStatus',
          type: 'select',
          required: true,
          defaultValue: 'pending',
          label: 'Disponibilité',
          options: [
            { label: 'À confirmer', value: 'pending' },
            { label: 'Confirmée', value: 'confirmed' },
            { label: 'Indisponible', value: 'unavailable' },
            { label: 'Remplacée', value: 'replaced' },
          ],
        },
        { name: 'availabilityNote', type: 'textarea', label: 'Note de disponibilité' },
        // Prestation indisponible (US4, T089, FR-005) : deux alternatives au plus, choix du
        // voyageur sous 48 h, sinon remboursement intégral automatique.
        {
          name: 'alternatives',
          type: 'array',
          maxRows: 2,
          label: 'Alternatives proposées (si indisponible)',
          labels: { singular: 'Alternative', plural: 'Alternatives' },
          fields: [
            { name: 'title', type: 'text', required: true, label: 'Alternative' },
            { name: 'description', type: 'textarea', label: 'Précisions pour le voyageur' },
            amountField('price', 'Prix de l’alternative (jamais facturé au-delà du prix payé)'),
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'unavailableAt',
              type: 'date',
              label: 'Indisponible depuis',
              admin: { readOnly: true },
            },
            {
              name: 'choiceDeadline',
              type: 'date',
              label: 'Choix attendu avant',
              admin: { readOnly: true },
            },
            {
              name: 'travellerChoice',
              type: 'select',
              label: 'Choix du voyageur',
              admin: { readOnly: true },
              options: [
                { label: 'Alternative 1', value: 'alternative_1' },
                { label: 'Alternative 2', value: 'alternative_2' },
                { label: 'Remboursement', value: 'refund' },
              ],
            },
          ],
        },
        { name: 'cancelled', type: 'checkbox', defaultValue: false, label: 'Annulée' },
        { name: 'partnerNotifiedAt', type: 'date', label: 'Prestataire notifié le' },
      ],
    },
    {
      type: 'row',
      fields: [
        { ...amountField('total', 'Total'), access: readOnlyMoney },
        { ...amountField('amountPaid', 'Encaissé net'), access: readOnlyMoney },
      ],
    },
    {
      name: 'paymentPlan',
      type: 'select',
      required: true,
      label: 'Plan de paiement',
      access: readOnlyMoney,
      options: [
        { label: 'Paiement total', value: 'full' },
        { label: 'Acompte et solde', value: 'deposit' },
      ],
    },
    {
      type: 'row',
      fields: [
        { ...amountField('depositAmount', 'Acompte'), access: readOnlyMoney },
        { ...amountField('balanceAmount', 'Solde'), access: readOnlyMoney },
        civilDateField('balanceDueDate', 'Solde dû le'),
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'awaiting_payment',
      index: true,
      label: 'Statut',
      options: BOOKING_STATUSES.map((value) => ({ value, label: statusLabels[value] })),
    },
    civilDateField('firstArrivalDate', 'Première date', true),
    { name: 'availabilityDeadline', type: 'date', label: 'Disponibilité à confirmer avant' },
    {
      name: 'manageTokenHash',
      type: 'text',
      label: 'Empreinte du jeton de gestion',
      access: { read: () => false, update: () => false },
      admin: { hidden: true },
    },
    {
      name: 'voucher',
      type: 'group',
      label: 'Bon de réservation',
      fields: [
        integerField('version', 'Version', { defaultValue: 0 }),
        { name: 'generatedAt', type: 'date', label: 'Généré le' },
      ],
    },
    { name: 'consentProcessingAt', type: 'date', required: true, label: 'Consentement le' },
  ],
};
