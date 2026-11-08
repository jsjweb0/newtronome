import { describe, expect, it } from 'vitest';
import { getGeneratedCover, hashPlaylistId } from './generatedCover';
import { PLAYLISTS } from '../data/playlists';

// 시안 PlaylistCovers의 id별 글씨색 (색 조합 대조용)
const DESIGN_TEXT_COLORS: Record<string, string> = {
  '2025-summer': '#B23A2E',
  '2020-spring': '#0B2A33',
  '2019-spring': '#F2D0DA',
  '2018-disco': '#FFFFFF',
  '2017-summer': '#7A2338',
  '2017-spring': '#0B2A33',
  '2017spring': '#0B2A33',
  m3stc8ixvqcw: '#FFFFFF',
  lkuriahk4u4p: '#7A2338',
  '1j886wtueuzr': '#2B2418',
  'spring-disco': '#F2D0DA',
  'autumn-disco': '#14434B',
  'summer-disco2': '#2B2418',
};

describe('generated playlist cover', () => {
  it('hashes ids the same way every time (FNV-1a 32bit)', () => {
    expect(hashPlaylistId('')).toBe(0x811c9dc5);
    expect(hashPlaylistId('a')).toBe(0xe40c292c);
    expect(hashPlaylistId('2025-summer')).toBe(hashPlaylistId('2025-summer'));
    expect(getGeneratedCover('autumn-disco')).toEqual(getGeneratedCover('autumn-disco'));
  });

  it('matches the design colors and gives every coverless playlist a different combination', () => {
    const coverless = PLAYLISTS.filter((playlist) => !playlist.coverUrl);
    const combos = coverless.map((playlist) => {
      const { paletteIndex, shapeIndex, palette } = getGeneratedCover(playlist.id);
      expect(palette.lc).toBe(DESIGN_TEXT_COLORS[playlist.id]);
      return `${paletteIndex}-${shapeIndex}`;
    });

    expect(coverless).toHaveLength(13);
    expect(new Set(combos).size).toBe(13);
  });
});
