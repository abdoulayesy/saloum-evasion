import path from 'node:path';
import sharp from 'sharp';
import { APIError, type CollectionBeforeChangeHook, type CollectionConfig } from 'payload';
import { anyone, isTeam } from '@/access';
import { provenanceField } from '@/fields/provenance';

export const MEDIA_MIN_WIDTH = 1600;

// Photos réelles (data-model « media ») : textes alternatifs FR et EN obligatoires,
// provenance obligatoire, source d'au moins 1600 px de large (les dérivés AVIF/WebP sont
// produits par next/image), placeholder flou généré à l'envoi.

const blurAndCheckWidth: CollectionBeforeChangeHook = async ({ data, req }) => {
  const file = req.file;
  if (!file) return data;
  const image = sharp(file.data);
  const { width } = await image.metadata();
  if (width !== undefined && width < MEDIA_MIN_WIDTH) {
    throw new APIError(
      `Image de ${width} px de large : ${MEDIA_MIN_WIDTH} px au minimum.`,
      400,
      undefined,
      true,
    );
  }
  const blur = await image.resize(16).webp({ quality: 40 }).toBuffer();
  return { ...data, blurDataURL: `data:image/webp;base64,${blur.toString('base64')}` };
};

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Photo', plural: 'Photos' },
  admin: { group: 'Médias', useAsTitle: 'filename' },
  access: { read: anyone, create: isTeam, update: isTeam, delete: isTeam },
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    // Stockage disque en local (dossier ./media, ignoré par git) ; S3 en production.
    staticDir: path.resolve(process.cwd(), 'media'),
  },
  hooks: { beforeChange: [blurAndCheckWidth] },
  fields: [
    {
      name: 'alt',
      type: 'group',
      label: 'Texte alternatif (obligatoire en français et en anglais)',
      admin: {
        description: 'Décrivez ce que montre la photo, comme à quelqu’un qui ne la voit pas.',
      },
      fields: [
        { name: 'fr', type: 'text', required: true, label: 'Français', maxLength: 180 },
        { name: 'en', type: 'text', required: true, label: 'English', maxLength: 180 },
      ],
    },
    provenanceField,
    {
      name: 'blurDataURL',
      type: 'text',
      admin: { readOnly: true, hidden: true },
    },
  ],
};
