import type { Clip, VideoObject } from 'schema-dts';
import { htmlLang, type Locale } from '@/i18n/routing';
import { mp4Url, thumbnailUrl } from '@/lib/mux';
import { organizationId } from './organization';

// Film → VideoObject + Clip par chapitre (contrat jsonld.md, seo CHK019) ; vidéo verticale →
// VideoObject seul. `contentUrl` = rendu MP4 statique (un .m3u8 n'est pas indexable),
// `endOffset` = début du chapitre suivant, ou durée totale pour le dernier.

export type VideoChapter = { title: string; startSeconds: number };

export type VideoInput = {
  /** URL de la page qui montre la vidéo (sans paramètre). */
  pageUrl: string;
  /** Fragment de l'@id : `film`, `video-2`… */
  fragment: string;
  origin: string;
  locale: Locale;
  name: string;
  description: string;
  playbackId: string;
  durationSeconds: number;
  uploadDate: string;
  chapters?: readonly VideoChapter[];
};

/** Durée ISO 8601 : 250 → PT4M10S. */
export const isoDuration = (totalSeconds: number): string => {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return `PT${hours > 0 ? `${hours}H` : ''}${minutes > 0 ? `${minutes}M` : ''}${rest > 0 || seconds === 0 ? `${rest}S` : ''}`;
};

/** Lien de chapitre visible et `Clip.url` : même URL, `?t={secondes}`. */
export const chapterUrl = (pageUrl: string, startSeconds: number): string =>
  `${pageUrl}?t=${Math.round(startSeconds)}`;

export const buildClips = (
  pageUrl: string,
  chapters: readonly VideoChapter[],
  durationSeconds: number,
): Clip[] =>
  chapters.map((chapter, index) => ({
    '@type': 'Clip',
    name: chapter.title,
    startOffset: chapter.startSeconds,
    endOffset: chapters[index + 1]?.startSeconds ?? durationSeconds,
    url: chapterUrl(pageUrl, chapter.startSeconds),
  }));

export const buildVideo = (input: VideoInput): VideoObject => {
  const chapters = input.chapters ?? [];
  return {
    '@type': 'VideoObject',
    '@id': `${input.pageUrl}#${input.fragment}`,
    name: input.name,
    description: input.description,
    thumbnailUrl: [thumbnailUrl(input.playbackId)],
    uploadDate: input.uploadDate,
    duration: isoDuration(input.durationSeconds),
    contentUrl: mp4Url(input.playbackId),
    embedUrl: input.pageUrl,
    inLanguage: htmlLang[input.locale],
    publisher: { '@id': organizationId(input.origin) },
    ...(chapters.length > 0
      ? { hasPart: buildClips(input.pageUrl, chapters, input.durationSeconds) }
      : {}),
  };
};
