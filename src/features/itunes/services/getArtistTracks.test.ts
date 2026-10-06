import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getArtistTracks } from './getArtistTracks';
import type { ITunesTrack } from '../types/itunes.types';

const validTrack: ITunesTrack = {
  artistId: 100,
  trackId: 1,
  trackName: 'Track',
  artistName: 'Artist',
  trackTimeMillis: 180_000,
};

const artist = {
  wrapperType: 'artist',
  artistId: 100,
  artistName: 'Artist',
};

const fetchMock = vi.fn<typeof fetch>();

function respondWith(data: unknown) {
  fetchMock.mockResolvedValue(Response.json(data));
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getArtistTracks', () => {
  it('requests the artist songs from the US store and forwards the abort signal', async () => {
    const controller = new AbortController();
    respondWith({ resultCount: 2, results: [artist, validTrack] });

    await expect(getArtistTracks({
      artistId: 100,
      signal: controller.signal,
    })).resolves.toEqual([validTrack]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [requestUrl, options] = fetchMock.mock.calls[0];
    const url = new URL(String(requestUrl));
    expect(url.origin).toBe('https://itunes.apple.com');
    expect(url.pathname).toBe('/lookup');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      id: '100',
      entity: 'song',
      limit: '5',
      sort: 'recent',
      country: 'US',
    });
    expect(options?.signal).toBe(controller.signal);
  });

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity])(
    'rejects invalid artist ID %s before sending a request',
    async (artistId) => {
      await expect(getArtistTracks({ artistId })).rejects.toThrow(
        '아티스트 ID가 올바르지 않습니다.'
      );
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it('filters artist metadata and malformed tracks before limiting the results to five', async () => {
    const tracks = Array.from({ length: 6 }, (_, index) => ({
      ...validTrack,
      trackId: index + 1,
    }));
    const results = [
      artist,
      null,
      { ...validTrack, artistId: '100' },
      { ...validTrack, trackId: -1 },
      ...tracks,
    ];
    respondWith({ resultCount: results.length, results });

    await expect(getArtistTracks({ artistId: 100 })).resolves.toEqual(
      tracks.slice(0, 5)
    );
  });

  it.each([
    { label: 'empty results', results: [] },
    { label: 'artist metadata only', results: [artist] },
  ])('returns an empty list for $label', async ({ results }) => {
    respondWith({ resultCount: results.length, results });

    await expect(getArtistTracks({ artistId: 100 })).resolves.toEqual([]);
  });

  it('rejects an HTTP error instead of returning an empty list', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 503 }));

    await expect(getArtistTracks({ artistId: 100 })).rejects.toThrow(
      '아티스트 곡 조회 요청에 실패했습니다.'
    );
  });

  it.each([
    { label: 'null response', data: null },
    { label: 'missing results', data: { resultCount: 1 } },
    { label: 'non-array results', data: { resultCount: 1, results: {} } },
    { label: 'negative count', data: { resultCount: -1, results: [] } },
    { label: 'fractional count', data: { resultCount: 1.5, results: [] } },
  ])('rejects a malformed response: $label', async ({ data }) => {
    respondWith(data);

    await expect(getArtistTracks({ artistId: 100 })).rejects.toThrow(
      '아티스트 곡 응답 형식이 올바르지 않습니다.'
    );
  });

  it('propagates a network failure', async () => {
    const error = new TypeError('Failed to fetch');
    fetchMock.mockRejectedValue(error);

    await expect(getArtistTracks({ artistId: 100 })).rejects.toBe(error);
  });

  it('propagates an abort without converting it to an empty result', async () => {
    const controller = new AbortController();
    controller.abort();
    const error = new DOMException('Aborted', 'AbortError');
    fetchMock.mockRejectedValue(error);

    await expect(getArtistTracks({
      artistId: 100,
      signal: controller.signal,
    })).rejects.toBe(error);
    expect(fetchMock.mock.calls[0][1]?.signal).toBe(controller.signal);
  });

  it('propagates invalid JSON as an error', async () => {
    fetchMock.mockResolvedValue(new Response('invalid JSON'));

    await expect(getArtistTracks({ artistId: 100 })).rejects.toThrow(SyntaxError);
  });
});
