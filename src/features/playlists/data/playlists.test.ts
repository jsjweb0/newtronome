import { describe, expect, it } from 'vitest';
import { findPlaylistById, PLAYLISTS } from './playlists';

describe('PLAYLISTS catalog', () => {
  it('has 16 playlists with unique ids', () => {
    expect(PLAYLISTS).toHaveLength(16);
    expect(new Set(PLAYLISTS.map((playlist) => playlist.id)).size).toBe(16);
  });

  it('keeps every SoundCloud URL matching its id', () => {
    PLAYLISTS.forEach((playlist) => {
      expect(playlist.soundCloudUrl).toBe(`https://soundcloud.com/ssu-1/sets/${playlist.id}`);
    });
  });

  it('finds a playlist by id and returns null for unknown ids', () => {
    expect(findPlaylistById('2017-spring')?.title).toBe('2017 입하 디스코');
    expect(findPlaylistById('unknown')).toBeNull();
    expect(findPlaylistById(undefined)).toBeNull();
  });
});
