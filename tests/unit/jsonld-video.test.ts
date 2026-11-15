import { describe, expect, it } from 'vitest';
import { buildVideo, chapterUrl, isoDuration } from '@/lib/seo/jsonld/video';

const origin = 'https://saloum-evasion.test';
const pageUrl = `${origin}/fr/film-immersion`;

const film = {
  pageUrl,
  fragment: 'film',
  origin,
  locale: 'fr' as const,
  name: 'Le Saloum, vécu de l’intérieur',
  description: 'Film d’immersion.',
  playbackId: 'abcDEF1234567890',
  durationSeconds: 250,
  uploadDate: '2026-11-01T09:00:00.000Z',
  chapters: [
    { title: 'Arrivée', startSeconds: 0 },
    { title: 'Bolongs', startSeconds: 74 },
    { title: 'Veillée', startSeconds: 150 },
  ],
};

describe('JSON-LD vidéo', () => {
  it('durée ISO 8601', () => {
    expect(isoDuration(250)).toBe('PT4M10S');
    expect(isoDuration(15)).toBe('PT15S');
    expect(isoDuration(120)).toBe('PT2M');
    expect(isoDuration(3725)).toBe('PT1H2M5S');
    expect(isoDuration(0)).toBe('PT0S');
  });

  it('film : VideoObject, MP4 en contentUrl, vignette Mux, éditeur', () => {
    expect(buildVideo(film)).toMatchObject({
      '@type': 'VideoObject',
      '@id': `${pageUrl}#film`,
      duration: 'PT4M10S',
      contentUrl: 'https://stream.mux.com/abcDEF1234567890/highest.mp4',
      thumbnailUrl: ['https://image.mux.com/abcDEF1234567890/thumbnail.jpg?width=1280'],
      embedUrl: pageUrl,
      inLanguage: 'fr-SN',
      uploadDate: '2026-11-01T09:00:00.000Z',
      publisher: { '@id': `${origin}/#org` },
    });
    expect(JSON.stringify(buildVideo(film))).not.toContain('.m3u8');
  });

  it('Clip par chapitre : endOffset = début du suivant, durée totale pour le dernier', () => {
    const video = buildVideo(film);
    expect(video).toMatchObject({
      hasPart: [
        { '@type': 'Clip', name: 'Arrivée', startOffset: 0, endOffset: 74, url: `${pageUrl}?t=0` },
        { name: 'Bolongs', startOffset: 74, endOffset: 150, url: `${pageUrl}?t=74` },
        { name: 'Veillée', startOffset: 150, endOffset: 250, url: `${pageUrl}?t=150` },
      ],
    });
  });

  it('vidéo verticale sans chapitres : pas de hasPart', () => {
    const vertical = buildVideo({ ...film, fragment: 'video-2', chapters: [] });
    expect(vertical).not.toHaveProperty('hasPart');
    expect(vertical['@id']).toBe(`${pageUrl}#video-2`);
  });

  it('URL de chapitre', () => {
    expect(chapterUrl(pageUrl, 74.4)).toBe(`${pageUrl}?t=74`);
  });
});
