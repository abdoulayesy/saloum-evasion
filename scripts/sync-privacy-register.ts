import { getPayload } from 'payload';
import config from '@payload-config';
import { pageBlocks } from '@/seed/pages';
import type { Page } from '@/payload-types';

// Mise à jour du « Registre des traitements » de la page Confidentialité (002, T101) dans un CMS
// déjà rempli (préproduction, production), où le seed ne s'exécute plus. Ajoute en FR et en EN les
// traitements du seed absents du registre (comparaison sur la finalité en français) ; ne modifie ni
// ne supprime aucune entrée existante, pour respecter les corrections de l'équipe. Idempotent.
// Usage : pnpm cms:privacy-register

type Block = NonNullable<Page['blocks']>[number];
type RegisterBlock = Extract<Block, { blockType: 'processingRegister' }>;
type Entry = NonNullable<RegisterBlock['entries']>[number];

const isRegister = (block: Block): block is RegisterBlock =>
  block.blockType === 'processingRegister';

const NO_PHOTOS = { photo: () => 0, galleryPhotos: [], teamMembers: [] };

const seedEntries = (lang: 'fr' | 'en'): Entry[] =>
  pageBlocks('privacy', lang, NO_PHOTOS, '')
    .filter(isRegister)
    .flatMap((block) => block.entries ?? []);

const withEntries = (blocks: readonly Block[], entries: Entry[]): Block[] =>
  blocks.map((block) => (isRegister(block) ? { ...block, entries } : block));

const payload = await getPayload({ config });
const found = await payload.find({
  collection: 'pages',
  where: { key: { equals: 'privacy' } },
  locale: 'fr',
  depth: 0,
  limit: 1,
});
const french = found.docs[0];
const register = french?.blocks?.find(isRegister);
if (!french || !register) {
  payload.logger.warn('Page Confidentialité ou registre introuvable : rien à faire.');
  process.exit(0);
}

const existing = register.entries ?? [];
const known = new Set(existing.map((entry) => entry.purpose));
const seedFr = seedEntries('fr');
const seedEn = seedEntries('en');
const missing = seedFr.flatMap((entry, index) =>
  known.has(entry.purpose) ? [] : [{ fr: entry, en: seedEn[index] }],
);
if (missing.length === 0) {
  payload.logger.info('Registre des traitements déjà à jour.');
  process.exit(0);
}

const previousIds = new Set(existing.map((entry) => entry.id));
await payload.update({
  collection: 'pages',
  id: french.id,
  locale: 'fr',
  data: {
    blocks: withEntries(french.blocks ?? [], [...existing, ...missing.map(({ fr }) => fr)]),
  },
});

// Anglais : mêmes lignes (identifiants créés à l'étape française), textes anglais du seed.
const english = await payload.findByID({
  collection: 'pages',
  id: french.id,
  locale: 'en',
  depth: 0,
});
const englishEntries = english.blocks?.find(isRegister)?.entries ?? [];
let added = 0;
const translated = englishEntries.map((entry) => {
  if (previousIds.has(entry.id)) return entry;
  const source = missing[added]?.en;
  added += 1;
  return source ? { ...source, id: entry.id } : entry;
});
await payload.update({
  collection: 'pages',
  id: french.id,
  locale: 'en',
  data: { blocks: withEntries(english.blocks ?? [], translated) },
});

payload.logger.info(
  `Registre des traitements : ${missing.length} entrée(s) ajoutée(s) — ${missing.map(({ fr }) => fr.purpose).join(', ')}.`,
);
process.exit(0);
