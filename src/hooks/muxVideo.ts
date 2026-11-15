import { APIError, type CollectionBeforeValidateHook } from 'payload';
import { isPlaybackId } from '@/lib/mux';

// T123 : avant validation d'une vidéo, vérifie l'identifiant de lecture auprès de l'API Mux et
// renseigne la durée réelle de l'actif. Sans identifiants d'API (développement, démonstration),
// seul le format de l'identifiant est contrôlé et la durée saisie est conservée.

const MUX_API = 'https://api.mux.com/video/v1';

type MuxCredentials = { tokenId: string; tokenSecret: string };

const credentials = (): MuxCredentials | null => {
  const tokenId = process.env.MUX_TOKEN_ID?.trim();
  const tokenSecret = process.env.MUX_TOKEN_SECRET?.trim();
  return tokenId && tokenSecret ? { tokenId, tokenSecret } : null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const muxGet = async (path: string, auth: MuxCredentials): Promise<unknown> => {
  const token = Buffer.from(`${auth.tokenId}:${auth.tokenSecret}`).toString('base64');
  const response = await fetch(`${MUX_API}${path}`, {
    headers: { Authorization: `Basic ${token}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new APIError(`API Mux : réponse ${response.status}.`, 502);
  const body: unknown = await response.json();
  return isRecord(body) ? body.data : null;
};

/** Durée (secondes, arrondie) de l'actif lié à l'identifiant, ou null s'il est inconnu. */
export const fetchMuxDuration = async (
  playbackId: string,
  auth: MuxCredentials,
): Promise<number | null> => {
  const playback = await muxGet(`/playback-ids/${playbackId}`, auth);
  const object = isRecord(playback) ? playback.object : null;
  if (!isRecord(object) || object.type !== 'asset' || typeof object.id !== 'string') return null;
  const asset = await muxGet(`/assets/${object.id}`, auth);
  return isRecord(asset) && typeof asset.duration === 'number'
    ? Math.max(1, Math.round(asset.duration))
    : null;
};

export const verifyMuxVideo: CollectionBeforeValidateHook = async ({ data }) => {
  if (!data) return data;
  const playbackId = typeof data.muxPlaybackId === 'string' ? data.muxPlaybackId.trim() : '';
  if (!playbackId) return data;
  if (!isPlaybackId(playbackId)) {
    throw new APIError('Identifiant de lecture Mux invalide (lettres et chiffres).', 400);
  }
  const auth = credentials();
  if (!auth) return { ...data, muxPlaybackId: playbackId };
  const duration = await fetchMuxDuration(playbackId, auth);
  if (duration === null) {
    throw new APIError('Identifiant de lecture inconnu chez Mux.', 400);
  }
  return { ...data, muxPlaybackId: playbackId, durationSeconds: duration };
};
