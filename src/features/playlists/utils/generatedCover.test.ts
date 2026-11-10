import { describe, expect, it } from 'vitest';
import { COVER_PALETTES, COVER_SHAPES, getGeneratedCover, hashPlaylistId } from './generatedCover';
import { PLAYLISTS } from '../data/playlists';

describe('generated playlist cover', () => {
  it('hashes ids the same way every time (FNV-1a 32bit)', () => {
    expect(hashPlaylistId('')).toBe(0x811c9dc5);
    expect(hashPlaylistId('a')).toBe(0xe40c292c);
    expect(hashPlaylistId('2025-summer')).toBe(hashPlaylistId('2025-summer'));
    expect(getGeneratedCover('autumn-disco')).toEqual(getGeneratedCover('autumn-disco'));
  });

  it('gives catalog playlists distinct background colors and stable covers', () => {
    const backgroundColors = PLAYLISTS.map(({ id }) => {
      const cover = getGeneratedCover(id);
      expect(COVER_PALETTES).toContain(cover.palette);
      expect(COVER_SHAPES).toContain(cover.shape);
      expect(getGeneratedCover(id)).toEqual(cover);
      return cover.palette.c1.toLowerCase();
    });

    expect(new Set(backgroundColors).size).toBe(PLAYLISTS.length);
  });
});
