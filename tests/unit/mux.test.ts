import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchMuxDuration } from '@/hooks/muxVideo';
import { hlsUrl, isPlaybackId, mp4Url, thumbnailUrl } from '@/lib/mux';

const auth = { tokenId: 'id', tokenSecret: 'secret' };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

afterEach(() => vi.unstubAllGlobals());

describe('Mux', () => {
  it('URL de lecture, de rendu MP4 et de vignette', () => {
    expect(hlsUrl('abc123DEF456')).toBe('https://stream.mux.com/abc123DEF456.m3u8');
    expect(mp4Url('abc123DEF456')).toBe('https://stream.mux.com/abc123DEF456/highest.mp4');
    expect(mp4Url('abc123DEF456', 'low')).toBe('https://stream.mux.com/abc123DEF456/low.mp4');
    expect(thumbnailUrl('abc123DEF456', 640)).toBe(
      'https://image.mux.com/abc123DEF456/thumbnail.jpg?width=640',
    );
  });

  it('format de l’identifiant de lecture', () => {
    expect(isPlaybackId('EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs')).toBe(true);
    expect(isPlaybackId('abc')).toBe(false);
    expect(isPlaybackId('abc/../../secret')).toBe(false);
  });

  it('durée lue sur l’actif lié à l’identifiant de lecture, arrondie', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({ data: { object: { type: 'asset', id: 'asset-1' } } }))
      .mockResolvedValueOnce(json({ data: { duration: 249.6 } }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchMuxDuration('abc123DEF456', auth)).resolves.toBe(250);
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain('/assets/asset-1');
  });

  it('identifiant inconnu : null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ error: 'not found' }, 404)));
    await expect(fetchMuxDuration('abc123DEF456', auth)).resolves.toBeNull();
  });
});
