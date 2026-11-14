import type { CollectionConfig } from 'payload';
import { pageBlocks } from '@/blocks';
import { hasText, localeStatusField, seoComplete } from '@/fields/localeStatus';
import { requiredInFrench } from '@/fields/localized';
import { seoField } from '@/fields/seo';
import { contentDefaults } from './shared';

export const PAGE_KEYS = [
  'home',
  'commitment',
  'about',
  'faq',
  'contact',
  'legal',
  'privacy',
  'film',
  'stays_list',
  'experiences_hub',
  'accommodations_list',
  'destinations_list',
  'not_found',
] as const;

export type PageKey = (typeof PAGE_KEYS)[number];

const keyLabels: Record<PageKey, string> = {
  home: 'Accueil',
  commitment: 'Notre engagement',
  about: 'À propos',
  faq: 'FAQ',
  contact: 'Contact',
  legal: 'Mentions légales',
  privacy: 'Confidentialité',
  film: 'Film d’immersion',
  stays_list: 'Liste des séjours',
  experiences_hub: 'Hub des expériences',
  accommodations_list: 'Liste des hébergements',
  destinations_list: 'Liste des destinations',
  not_found: 'Page introuvable (404)',
};

// Pages éditoriales et pages sans document propre (listes, hub, 404) : elles fournissent
// title, description et image de partage, éditables et soumis au contrôle d'unicité.
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Page', plural: 'Pages' },
  admin: { useAsTitle: 'title', group: 'Contenus', defaultColumns: ['title', 'key', '_status'] },
  ...contentDefaults({ englishCheck: (data) => hasText(data.title) && seoComplete(data) }),
  fields: [
    {
      name: 'key',
      type: 'select',
      required: true,
      unique: true,
      label: 'Page',
      options: PAGE_KEYS.map((value) => ({ value, label: keyLabels[value] })),
      admin: { position: 'sidebar' },
    },
    {
      name: 'title',
      type: 'text',
      localized: true,
      label: 'Titre (H1)',
      validate: requiredInFrench(() => true, 'Titre'),
    },
    { name: 'blocks', type: 'blocks', blocks: pageBlocks, label: 'Contenu de la page' },
    seoField(),
    localeStatusField,
  ],
};
