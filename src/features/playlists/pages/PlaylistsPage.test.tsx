import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import PlaylistsPage from './PlaylistsPage';
import PlaylistDetailPage from './PlaylistDetailPage';
import { PLAYLISTS } from '../data/playlists';
import { usePlayerStore } from '../../player/stores/usePlayerStore';
import type { PlayerTrack } from '../../player/types/player.types';

const playingTrack: PlayerTrack = {
  id: 1,
  title: 'Now Playing',
  artist: 'Artist',
  artworkUrl: null,
  permalinkUrl: null,
  durationMs: 180_000,
  genre: '',
  tags: [],
};

function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      <button type="button" onClick={() => navigate(-1)}>
        브라우저 뒤로
      </button>
      <p data-testid="location">{location.pathname + location.search}</p>
    </>
  );
}

function renderRoutes(initialEntry = '/playlists') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <BackButton />
      <Routes>
        <Route path="/playlists" element={<PlaylistsPage />} />
        <Route path="/playlists/:playlistId" element={<PlaylistDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

const getList = () => screen.getByRole('list', { name: '플레이리스트 목록' });

describe('PlaylistsPage', () => {
  beforeEach(() => {
    usePlayerStore.setState({
      tracks: [playingTrack],
      currentTrack: playingTrack,
      playbackMode: 'playlist',
      isPlaying: true,
      currentTime: 42,
      duration: 180,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders every catalog playlist as a link to its detail page', () => {
    renderRoutes();

    expect(screen.getByRole('heading', { level: 1, name: 'Playlists' })).toBeTruthy();
    expect(screen.getByText(`${PLAYLISTS.length}개`)).toBeTruthy();

    const links = within(getList()).getAllByRole('link');
    expect(links).toHaveLength(PLAYLISTS.length);
    links.forEach((link, index) => {
      expect(link.getAttribute('href')).toBe(`/playlists/${PLAYLISTS[index].id}`);
    });
  });

  it('filters by title and keeps the filter after coming back from the detail', () => {
    renderRoutes();

    fireEvent.change(screen.getByRole('searchbox', { name: '플레이리스트 검색' }), {
      target: { value: 'autumn' },
    });

    const links = within(getList()).getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(screen.getByText(`1 / ${PLAYLISTS.length}개`)).toBeTruthy();

    fireEvent.click(links[0]);
    expect(screen.getByRole('heading', { level: 1, name: 'Autumn Disco' })).toBeTruthy();
    expect(screen.getByTestId('location').textContent).toBe('/playlists/autumn-disco');

    fireEvent.click(screen.getByRole('button', { name: '브라우저 뒤로' }));

    expect(screen.getByTestId('location').textContent).toBe('/playlists?q=autumn');
    expect(
      (screen.getByRole('searchbox', { name: '플레이리스트 검색' }) as HTMLInputElement).value
    ).toBe('autumn');
    expect(within(getList()).getAllByRole('link')).toHaveLength(1);
  });

  it('shows a message when nothing matches', () => {
    renderRoutes('/playlists?q=없는 제목');

    expect(screen.queryByRole('list', { name: '플레이리스트 목록' })).toBeNull();
    expect(screen.getByText('“없는 제목”에 맞는 플레이리스트가 없습니다.')).toBeTruthy();
  });

  it('goes list → detail → list without touching the current playback', () => {
    const before = usePlayerStore.getState();
    renderRoutes();

    fireEvent.click(
      screen.getByRole('link', { name: '2024 입하 디스코 플레이리스트, NEWTRONOME' })
    );
    fireEvent.click(screen.getByRole('link', { name: '목록으로' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Playlists' })).toBeTruthy();

    const after = usePlayerStore.getState();
    expect(after.tracks).toBe(before.tracks);
    expect(after.currentTrack).toBe(before.currentTrack);
    expect(after.isPlaying).toBe(true);
    expect(after.playbackMode).toBe('playlist');
    expect(after.currentTime).toBe(42);
  });
});
