import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { searchITunesTracks } from './searchITunesTracks';

const validTrack = {
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
