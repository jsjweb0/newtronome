import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { searchITunesTracks } from './searchITunesTracks';

const validTrack = {
  artistId: 100,
  trackId: 1,
  trackName: 'Track',
  artistName: 'Artist',
  trackTimeMillis: 180_000,
};

const fetchMock = vi.fn();

function respondWith(data: unknown) {
  fetchMock.mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue(data),
  } as unknown as Response);
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('searchITunesTracks numeric validation', () => {
  it('returns a track with valid numeric fields', async () => {
    respondWith({ resultCount: 1, results: [validTrack] });

    await expect(searchITunesTracks('track')).resolves.toEqual([validTrack]);
  });

  it.each([-1, 1.5, Number.NaN, Infinity])(
    'rejects invalid resultCount %s',
    async (resultCount) => {
      respondWith({ resultCount, results: [] });

      await expect(searchITunesTracks('track')).rejects.toThrow(
        '음악 검색 응답 형식이 올바르지 않습니다.'
      );
    }
  );

  it.each([
    { field: 'trackId', value: 0 },
    { field: 'trackId', value: -1 },
    { field: 'trackId', value: 1.5 },
    { field: 'trackId', value: Number.MAX_SAFE_INTEGER + 1 },
    { field: 'trackTimeMillis', value: -1 },
    { field: 'trackTimeMillis', value: Number.NaN },
    { field: 'trackTimeMillis', value: Infinity },
  ] as const)(
    'rejects a track with invalid $field $value',
    async ({ field, value }) => {
      respondWith({
        resultCount: 1,
        results: [{ ...validTrack, [field]: value }],
      });

      await expect(searchITunesTracks('track')).rejects.toThrow(
        '음악 검색 응답 형식이 올바르지 않습니다.'
      );
    }
  );

  it('returns an empty array for an actual empty result', async () => {
    respondWith({ resultCount: 0, results: [] });

    await expect(searchITunesTracks('track')).resolves.toEqual([]);
  });

  it('returns valid tracks when valid and invalid entries are mixed', async () => {
    respondWith({
      resultCount: 2,
      results: [validTrack, { ...validTrack, trackId: -1 }],
    });

    await expect(searchITunesTracks('track')).resolves.toEqual([validTrack]);
  });
});


it('선택 URL이 유효하지 않아도 정상 곡은 반환하고 해당 기능만 숨긴다', async () => {
  respondWith({ resultCount: 1, results: [{ ...validTrack,
    artworkUrl100: 'javascript:alert(1)', previewUrl: 'http://example.com/audio',
    trackViewUrl: 'https://music.apple.com/us/song/test?i=1',
  }] });
  const tracks = await searchITunesTracks('track');
  expect(tracks).toHaveLength(1);
  expect(tracks[0]).toMatchObject({ trackId: 1, trackViewUrl: 'https://music.apple.com/us/song/test?i=1' });
  expect(tracks[0].artworkUrl100).toBeUndefined();
  expect(tracks[0].previewUrl).toBeUndefined();
});
