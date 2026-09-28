import { describe, expect, it } from 'vitest';
import { parsePetPostsResponse, parseRegionOptionsResponse } from './petApi';

describe('pet API response parsing', () => {
  it('keeps a valid empty response distinct from an invalid response', () => {
    expect(
      parsePetPostsResponse({
        response: {
          header: { resultCode: '00' },
          body: { items: { item: [] } },
        },
      })
    ).toEqual([]);

    expect(() => parsePetPostsResponse({ error: 'upstream failure' })).toThrow(
      '응답 형식'
    );
  });

  it('rejects an API error and normalizes valid post and region values', () => {
    expect(() =>
      parsePetPostsResponse({
        response: {
          header: { resultCode: '03', resultMsg: 'NO_DATA' },
          body: {},
        },
      })
    ).toThrow('NO_DATA');

    expect(
      parsePetPostsResponse({
        response: {
          header: { resultCode: '00' },
          body: { items: { item: { desertionNo: 123, kindNm: '고양이' } } },
        },
      })
    ).toEqual([expect.objectContaining({ desertionNo: '123', kindNm: '고양이' })]);

    expect(
      parseRegionOptionsResponse({
        response: {
          header: { resultCode: '00' },
          body: { items: { item: [{ orgdownNm: '서울특별시' }] } },
        },
      })
    ).toEqual([{ orgdownNm: '서울특별시' }]);
  });
});
