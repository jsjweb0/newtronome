import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PlaylistDetailPage from './PlaylistDetailPage';
import { usePlayerStore } from '../../player/stores/usePlayerStore';
import type { PlayerTrack } from '../../player/types/player.types';
import { createOutletContext, fakeSound, installFakeSoundCloud } from '../test-utils';

vi.mock('../../../components/ui/Slider', () => ({
  default: ({ images }: { images: string[] }) => <div data-testid="slider">{images.length}</div>,
}));

vi.mock('../../../components/track/TrackItemActions', () => ({ default: () => null }));
const playlistTrack: PlayerTrack = {
  id: 99,
  title: 'Main Playlist Song',
  artist: 'Someone',
  artworkUrl: null,
  permalinkUrl: null,
  durationMs: 1000,
  genre: '',
  tags: [],
};

function renderAt(pathname: string, context = createOutletContext()) {
  const view = render(
    <MemoryRouter initialEntries={[pathname]}>
      <Routes>
        <Route element={<Outlet context={context} />}>
          <Route path="/playlists/:playlistId" element={<PlaylistDetailPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

  return { ...view, context };
}

describe('PlaylistDetailPage', () => {
  beforeEach(() => {
    usePlayerStore.setState({
      tracks: [playlistTrack],
      currentTrack: playlistTrack,
      playbackMode: 'playlist',
      isPlaying: true,
      currentTime: 10,
      duration: 100,
    });
  });

  afterEach(() => {
    cleanup();
    delete window.SC;
  });

  it('looks up the playlist by URL id and shows its info and track list', async () => {
    installFakeSoundCloud([
      fakeSound(1, 'First Song', 'https://i1.sndcdn.com/artworks-a-large.jpg'),
      fakeSound(2, 'Second Song'),
    ]);
    const { container } = renderAt('/playlists/2024-spring');

    expect(
      await screen.findByRole('heading', { level: 1, name: '2024 입하 디스코' })
    ).toBeTruthy();
    expect(screen.getByText('2 Tracks')).toBeTruthy();
    expect(screen.getByText('6분')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Track List' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /First Song/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Second Song/ })).toBeTruthy();

    expect(
      screen.getByRole('link', { name: 'SoundCloud에서 플레이리스트 열기 (새 창)' }).getAttribute('href')
    ).toBe('https://soundcloud.com/ssu-1/sets/2024-spring');
    expect(screen.getByRole('link', { name: '목록으로' }).getAttribute('href')).toBe('/playlists');

    const frame = container.querySelector('iframe');
    expect(decodeURIComponent(frame?.getAttribute('src') ?? '')).toContain(
      'url=https://soundcloud.com/ssu-1/sets/2024-spring'
    );
  });

  it('plays a clicked track on its own without replacing the current playlist', async () => {
    installFakeSoundCloud([fakeSound(1, 'First Song')]);
    const { context } = renderAt('/playlists/2024-spring');

    fireEvent.click(await screen.findByRole('button', { name: /First Song/ }));

    expect(context.onPlaySingleTrack).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, title: 'First Song' })
    );
    expect(context.onSelectTrack).not.toHaveBeenCalled();

    const state = usePlayerStore.getState();
    expect(state.tracks).toEqual([playlistTrack]);
    expect(state.currentTime).toBe(10);
  });

  it('shows a retry state when the tracks cannot be loaded', async () => {
    installFakeSoundCloud('error');
    renderAt('/playlists/2024-spring');

    expect(await screen.findByText('플레이리스트 곡 목록을 불러오지 못했습니다.')).toBeTruthy();
  });

  it('shows a not-found message with a link back to the list for an unknown id', () => {
    installFakeSoundCloud([]);
    const { container } = renderAt('/playlists/does-not-exist');

    expect(
      screen.getByRole('heading', { level: 1, name: '플레이리스트를 찾을 수 없습니다' })
    ).toBeTruthy();
    expect(
      screen.getByRole('link', { name: '플레이리스트 목록 보기' }).getAttribute('href')
    ).toBe('/playlists');
    expect(container.querySelector('iframe')).toBeNull();
  });
});
