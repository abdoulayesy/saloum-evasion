import type { GlobalConfig } from 'payload';
import { anyone, isTeam } from '@/access';
import { validateE164 } from '@/fields/validators';
import { revalidateGlobalAfterChange } from '@/hooks/revalidate';

const MONTH_DAY = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

const validateMonthDay = (value: unknown): true | string =>
  typeof value === 'string' && MONTH_DAY.test(value) ? true : 'Format MM-JJ, ex. 12-15.';

// Réglages du site (data-model « siteSettings ») : source unique du NAP (constitution III),
// du WhatsApp, des saisons, des garanties et des destinataires des notifications.
export const SiteSettings: GlobalConfig = {
  slug: 'siteSettings',
  label: 'Réglages du site',
  admin: { group: 'Administration' },
  access: { read: anyone, update: isTeam },
  hooks: { afterChange: [revalidateGlobalAfterChange] },
  fields: [
    {
      type: 'collapsible',
      label: 'Identité et coordonnées (NAP, identiques à la fiche Google)',
      fields: [
        {
          name: 'brandName',
          type: 'text',
          required: true,
          defaultValue: 'Saloum Évasion',
          label: 'Nom commercial',
        },
        { name: 'legalName', type: 'text', label: 'Raison sociale' },
        {
          name: 'address',
          type: 'group',
          label: 'Adresse',
          fields: [
            { name: 'streetAddress', type: 'text', label: 'Rue' },
            {
              name: 'locality',
              type: 'text',
              required: true,
              defaultValue: 'Ndangane',
              label: 'Localité',
            },
            {
              name: 'region',
              type: 'text',
              required: true,
              defaultValue: 'Fatick',
              label: 'Région',
            },
            { name: 'postalCode', type: 'text', label: 'Code postal' },
            {
              name: 'country',
              type: 'text',
              required: true,
              defaultValue: 'SN',
              label: 'Pays (code ISO)',
              admin: { readOnly: true },
            },
          ],
        },
        { name: 'phone', type: 'text', label: 'Téléphone (E.164)', validate: validateE164 },
        { name: 'whatsappNumber', type: 'text', label: 'WhatsApp (E.164)', validate: validateE164 },
        { name: 'email', type: 'email', label: 'E-mail de contact' },
        {
          name: 'geo',
          type: 'group',
          label: 'Coordonnées du siège',
          fields: [
            { name: 'latitude', type: 'number', min: -90, max: 90 },
            { name: 'longitude', type: 'number', min: -180, max: 180 },
          ],
        },
        {
          name: 'sameAs',
          type: 'array',
          label: 'Réseaux sociaux et fiche Google',
          fields: [{ name: 'url', type: 'text', required: true, label: 'URL' }],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Demandes et contact',
      fields: [
        {
          name: 'responseTimeText',
          type: 'text',
          localized: true,
          defaultValue: 'Réponse sous 24 h, souvent dans l’heure',
          label: 'Délai de réponse annoncé',
        },
        { name: 'notificationEmail', type: 'email', label: 'Destinataire des demandes' },
        {
          name: 'fallbackNotificationEmail',
          type: 'email',
          label: 'Adresse de secours',
          admin: { description: 'Alertée si l’envoi d’une demande échoue après les relances.' },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Saisons, garanties et paiement',
      fields: [
        {
          name: 'highSeasons',
          type: 'array',
          label: 'Périodes de haute saison',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'from',
                  type: 'text',
                  required: true,
                  label: 'Du (MM-JJ)',
                  validate: validateMonthDay,
                },
                {
                  name: 'to',
                  type: 'text',
                  required: true,
                  label: 'Au (MM-JJ)',
                  validate: validateMonthDay,
                },
              ],
            },
          ],
        },
        {
          name: 'guarantees',
          type: 'array',
          label: 'Garanties',
          fields: [
            { name: 'icon', type: 'text', label: 'Icône (identifiant)' },
            { name: 'title', type: 'text', localized: true, required: true, label: 'Titre' },
            { name: 'text', type: 'textarea', localized: true, label: 'Texte' },
          ],
        },
        {
          name: 'paymentMethods',
          type: 'select',
          hasMany: true,
          label: 'Moyens de paiement (ordre et rang fixes)',
          defaultValue: ['wave', 'orange_money', 'card'],
          admin: {
            readOnly: true,
            description: 'Wave, Orange Money et carte bancaire au même rang (constitution VI).',
          },
          options: [
            { label: 'Wave', value: 'wave' },
            { label: 'Orange Money', value: 'orange_money' },
            { label: 'Carte bancaire', value: 'card' },
          ],
        },
      ],
    },
  ],
};
