import type { CollectionConfig, PayloadRequest } from 'payload';
import { isTeam, publishedOrTeam } from '@/access';
import { requiredInFrench } from '@/fields/localized';
import { provenanceField } from '@/fields/provenance';
import { validateChapters } from '@/fields/validators';
import { verifyMuxVideo } from '@/hooks/muxVideo';
import { publishGuard } from '@/hooks/publishGuards';
import { revalidateHooks } from '@/hooks/revalidate';

type Data = Partial<Record<string, unknown>>;

const MAX_SECONDS: Record<string, number> = { vertical15: 15, loop: 8 };

const needsAccessibility = (data: Data): boolean =>
  data.format === 'film' || data.format === 'vertical15';

const captionLocales = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.flatMap((caption: unknown) =>
        typeof caption === 'object' &&
        caption !== null &&
        'locale' in caption &&
        typeof caption.locale === 'string'
          ? [caption.locale]
          : [],
      )
    : [];

// Vidéos (data-model) : HLS chez Mux, affiche obligatoire, durées plafonnées par format,
// sous-titres FR et EN et transcription descriptive obligatoires pour le film et les
// vidéos verticales (WCAG 1.2), chapitres strictement croissants (moments clés Google).
export const Videos: CollectionConfig = {
  slug: 'videos',
  labels: { singular: 'Vidéo', plural: 'Vidéos' },
  admin: { useAsTitle: 'title', group: 'Médias', defaultColumns: ['title', 'format', '_status'] },
  access: { read: publishedOrTeam, create: isTeam, update: isTeam, delete: isTeam },
  versions: { drafts: true, maxPerDoc: 25 },
  hooks: { ...revalidateHooks, beforeValidate: [verifyMuxVideo], beforeChange: [publishGuard] },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      label: 'Titre',
      validate: requiredInFrench(() => true, 'Titre'),
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      label: 'Description',
      validate: requiredInFrench(() => true, 'Description'),
    },
    {
      name: 'format',
      type: 'select',
      required: true,
      label: 'Format',
      options: [
        { label: 'Film principal', value: 'film' },
        { label: 'Verticale 15 s', value: 'vertical15' },
        { label: 'Boucle d’ambiance (≤ 8 s)', value: 'loop' },
      ],
    },
    { name: 'muxPlaybackId', type: 'text', required: true, label: 'Identifiant de lecture Mux' },
    {
      name: 'staticMp4Url',
      type: 'text',
      label: 'Fichier MP4 hébergé (boucle d’ambiance)',
      admin: {
        condition: (data: Data) => data.format === 'loop',
        description:
          'Facultatif : MP4 muet ≤ 1,5 Mo servi tel quel. Sinon, rendu MP4 « low » de Mux.',
      },
      validate: (value: unknown) =>
        value === null ||
        value === undefined ||
        value === '' ||
        (typeof value === 'string' && /^(\/|https:\/\/)\S+\.mp4$/.test(value))
          ? true
          : 'Adresse d’un fichier .mp4 (chemin commençant par / ou https://).',
    },
    {
      name: 'durationSeconds',
      type: 'number',
      required: true,
      min: 1,
      label: 'Durée (secondes)',
      validate: (value: unknown, { data }: { data: Data }) => {
        if (typeof value !== 'number' || value <= 0) return 'Durée obligatoire.';
        const max = typeof data.format === 'string' ? MAX_SECONDS[data.format] : undefined;
        return max !== undefined && value > max ? `Ce format dure ${max} secondes au plus.` : true;
      },
    },
    {
      name: 'poster',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Affiche (≤ 120 Ko après optimisation)',
    },
    {
      name: 'captions',
      type: 'array',
      label: 'Sous-titres (WebVTT)',
      fields: [
        {
          name: 'locale',
          type: 'select',
          required: true,
          options: [
            { label: 'Français', value: 'fr' },
            { label: 'English', value: 'en' },
          ],
        },
        {
          name: 'url',
          type: 'text',
          required: true,
          label: 'URL du fichier .vtt',
          admin: {
            description: 'Fichier de sous-titres hébergé chez Mux ou dans le stockage des médias.',
          },
        },
      ],
      validate: (value: unknown, { data }: { data: Data }) => {
        if (!needsAccessibility(data)) return true;
        const locales = captionLocales(value);
        return locales.includes('fr') && locales.includes('en')
          ? true
          : 'Sous-titres français et anglais obligatoires pour ce format.';
      },
    },
    {
      name: 'chapters',
      type: 'array',
      label: 'Chapitres',
      fields: [
        {
          name: 'title',
          type: 'text',
          localized: true,
          label: 'Titre',
          validate: requiredInFrench(() => true, 'Titre du chapitre'),
        },
        { name: 'startSeconds', type: 'number', required: true, min: 0, label: 'Début (secondes)' },
      ],
      validate: (value: unknown, { data }: { data: Data }) => {
        const chapters = Array.isArray(value)
          ? value.map((chapter: unknown) => ({
              startSeconds:
                typeof chapter === 'object' &&
                chapter !== null &&
                'startSeconds' in chapter &&
                typeof chapter.startSeconds === 'number'
                  ? chapter.startSeconds
                  : null,
            }))
          : [];
        return validateChapters(chapters, data.format === 'film' ? 2 : 0);
      },
    },
    { name: 'uploadDate', type: 'date', required: true, label: 'Date de mise en ligne' },
    {
      name: 'descriptiveTranscript',
      type: 'richText',
      localized: true,
      label: 'Transcription descriptive',
      validate: (value: unknown, options: { data: Data; req: PayloadRequest }) =>
        needsAccessibility(options.data)
          ? requiredInFrench(() => true, 'Transcription')(value, options)
          : true,
    },
    provenanceField,
  ],
};
