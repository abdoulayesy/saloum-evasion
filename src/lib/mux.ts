// Mux (research R4) : URL de lecture HLS, rendu MP4 statique et images, construites à partir
// de l'identifiant de lecture. Module pur (aucun appel réseau) : utilisable côté client.
// La vérification d'un identifiant auprès de l'API Mux vit dans hooks/muxVideo.ts.

export const MUX_STREAM_ORIGIN = 'https://stream.mux.com';
export const MUX_IMAGE_ORIGIN = 'https://image.mux.com';

/** Identifiant de lecture Mux : lettres et chiffres uniquement. */
export const isPlaybackId = (value: string): boolean => /^[A-Za-z0-9]{10,64}$/.test(value);

/** Manifeste HLS adaptatif (lecture sur le site). */
export const hlsUrl = (playbackId: string): string => `${MUX_STREAM_ORIGIN}/${playbackId}.m3u8`;

/**
 * Rendu MP4 statique (doit être activé sur l'actif chez Mux) : `highest` pour le `contentUrl`
 * du JSON-LD (un manifeste .m3u8 n'est pas indexable), `low` pour la boucle d'ambiance.
 */
export const mp4Url = (playbackId: string, quality: 'highest' | 'low' = 'highest'): string =>
  `${MUX_STREAM_ORIGIN}/${playbackId}/${quality}.mp4`;

/** Vignette générée par Mux (JSON-LD `thumbnailUrl`, sitemap vidéo). */
export const thumbnailUrl = (playbackId: string, width = 1280): string =>
  `${MUX_IMAGE_ORIGIN}/${playbackId}/thumbnail.jpg?width=${width}`;
