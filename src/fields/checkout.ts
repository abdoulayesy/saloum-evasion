import type { Field, NumberField, TextField } from 'payload';

// Champs communs aux collections transactionnelles de la 002 (data-model) : dates civiles
// AAAA-MM-JJ stockées en texte (aucun décalage de fuseau possible, Africa/Dakar = UTC), montants
// XOF entiers signés ou non, effectifs.

const CIVIL_DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export const isCivilDate = (value: unknown): value is string =>
  typeof value === 'string' && CIVIL_DATE.test(value);

export const civilDateField = (name: string, label: string, required = false): TextField => ({
  name,
  type: 'text',
  label: `${label} (AAAA-MM-JJ)`,
  required,
  validate: (value: unknown) => {
    if (value === null || value === undefined || value === '')
      return required ? `${label} obligatoire.` : true;
    return isCivilDate(value) ? true : 'Date au format AAAA-MM-JJ.';
  },
});

/** Montant XOF entier ; `signed` pour les écritures d'ajustement (négatives). */
export const amountField = (
  name: string,
  label: string,
  { required = true, signed = false }: { required?: boolean; signed?: boolean } = {},
): NumberField => ({
  name,
  type: 'number',
  label: `${label} (FCFA)`,
  required,
  ...(signed ? {} : { min: 0 }),
  validate: (value: unknown) => {
    if (value === null || value === undefined) return required ? `${label} obligatoire.` : true;
    return typeof value === 'number' && Number.isInteger(value) && (signed || value >= 0)
      ? true
      : 'Montant en FCFA entier, sans décimales.';
  },
});

export const integerField = (
  name: string,
  label: string,
  {
    min = 0,
    max,
    required = true,
    defaultValue,
  }: {
    min?: number;
    max?: number;
    required?: boolean;
    defaultValue?: number;
  } = {},
): NumberField => ({
  name,
  type: 'number',
  label,
  required,
  min,
  ...(max === undefined ? {} : { max }),
  ...(defaultValue === undefined ? {} : { defaultValue }),
  validate: (value: unknown) => {
    if (value === null || value === undefined) return required ? `${label} obligatoire.` : true;
    if (typeof value !== 'number' || !Number.isInteger(value)) return 'Nombre entier attendu.';
    if (value < min || (max !== undefined && value > max))
      return max === undefined ? `Minimum ${min}.` : `Entre ${min} et ${max}.`;
    return true;
  },
});

export const OFFER_COLLECTIONS = ['stays', 'accommodations', 'experiences', 'transfers'] as const;

export const offerTypeOptions = [
  { label: 'Séjour signature', value: 'stay' },
  { label: 'Hébergement', value: 'accommodation' },
  { label: 'Expérience', value: 'experience' },
  { label: 'Table', value: 'table' },
  { label: 'Transfert', value: 'transfer' },
];

export const paymentMethodOptions = [
  { label: 'Wave', value: 'wave' },
  { label: 'Orange Money', value: 'orange_money' },
  { label: 'Carte bancaire', value: 'card' },
];

/** Champs d'une ligne de panier, recopiés tels quels dans la ligne de réservation. */
export const cartLineFields: Field[] = [
  { name: 'lineId', type: 'text', required: true, label: 'Identifiant de ligne' },
  {
    name: 'offerType',
    type: 'select',
    required: true,
    label: 'Type d’offre',
    options: offerTypeOptions,
  },
  {
    name: 'offer',
    type: 'relationship',
    relationTo: [...OFFER_COLLECTIONS],
    required: true,
    label: 'Offre',
  },
  civilDateField('startDate', 'Date (arrivée)', true),
  civilDateField('endDate', 'Départ'),
  { name: 'slot', type: 'text', label: 'Créneau' },
  {
    name: 'transferDirection',
    type: 'select',
    label: 'Sens du transfert',
    options: [
      { label: 'Aller', value: 'outbound' },
      { label: 'Retour', value: 'return' },
    ],
  },
  {
    name: 'transferTime',
    type: 'text',
    label: 'Heure de prise en charge (HH:mm)',
    validate: (value: unknown) =>
      value === null || value === undefined || value === ''
        ? true
        : typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
          ? true
          : 'Heure au format HH:mm.',
  },
  {
    type: 'row',
    fields: [
      integerField('adults', 'Adultes', { min: 1 }),
      integerField('children', 'Enfants', { defaultValue: 0 }),
      integerField('infants', 'Bébés', { defaultValue: 0 }),
    ],
  },
  amountField('quotedUnitPrice', 'Prix unitaire vu à l’ajout'),
  amountField('quotedTotal', 'Total vu à l’ajout'),
];
