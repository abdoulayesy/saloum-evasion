import type { Field, GlobalConfig } from 'payload';
import { anyone, isTeam } from '@/access';
import { revalidateGlobalAfterChange } from '@/hooks/revalidate';

const internalRoutes = [
  { label: 'Accueil', value: 'home' },
  { label: 'Séjours', value: 'staysList' },
  { label: 'Expériences', value: 'experiencesHub' },
  { label: 'Hébergements', value: 'accommodationsList' },
  { label: 'Destinations', value: 'destinationsList' },
  { label: 'Film d’immersion', value: 'film' },
  { label: 'Notre engagement', value: 'commitment' },
  { label: 'À propos', value: 'about' },
  { label: 'FAQ', value: 'faq' },
  { label: 'Contact', value: 'contact' },
  { label: 'Mentions légales', value: 'legal' },
  { label: 'Confidentialité', value: 'privacy' },
];

const menuField = (name: string, label: string): Field => ({
  name,
  type: 'array',
  label,
  fields: [
    { name: 'label', type: 'text', localized: true, label: 'Libellé (vide = libellé par défaut)' },
    { name: 'route', type: 'select', required: true, options: internalRoutes, label: 'Page' },
  ],
});

// Menus principal et pied de page : libellés localisés, liens internes typés (aucune URL
// saisie à la main, donc aucun lien cassé possible).
export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Navigation',
  admin: { group: 'Administration' },
  access: { read: anyone, update: isTeam },
  hooks: { afterChange: [revalidateGlobalAfterChange] },
  fields: [menuField('main', 'Menu principal'), menuField('footer', 'Pied de page')],
};
