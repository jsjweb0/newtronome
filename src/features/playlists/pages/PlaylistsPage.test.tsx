import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PlaylistsPage from './PlaylistsPage';
import { PLAYLISTS } from '../data/playlists';
import { usePlayerStore } from '../../player/stores/usePlayerStore';
import type { PlayerOutletContext } from '../../../layouts/MainLayout';

const currentPlaylist = PLAYLISTS[1];

function renderPage() {
  const context: PlayerOutletContext = {
    isSidebarCollapsed: false,
    playlistUrl: currentPlaylist.soundCloudUrl,
    currentPlaylistId: currentPlaylist.id,
    onSelectTrack: vi.fn(),
    onToggleTrack: vi.fn(),
    onPauseSoundCloud: vi.fn(),
    onPlaySingleTrack: vi.fn(),
    playlistStatus: 'ready',
    widgetError: null,
    retryLoad: vi.fn(),
  };

  return render(
    <MemoryRouter initialEntries={['/playlists']}>
      <Routes>
        <Route element={<Outlet context={context} />}>
          <Route path="/playlists" element={<PlaylistsPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('PlaylistsPage', () => {
  beforeEach(() => {
    usePlayerStore.setState({
      tracks: [
        {
          id: 1,
          title: 'Track A',
          artist: 'Artist',
          artworkUrl: null,
          permalinkUrl: null,
          durationMs: 30 * 60 * 1000,
          genre: '',
          tags: [],
        },
        {
          id: 2,
          title: 'Track B',
          artist: 'Artist',
          artworkUrl: null,
          permalinkUrl: null,
          durationMs: 45 * 60 * 1000,
          genre: '',
          tags: [],
        },
      ],
      currentTrack: null,
      playbackMode: 'playlist',
      isPlaying: true,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders every playlist as a link to the home detail', () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'Playlists' })).toBeTruthy();
    expect(screen.getByText(`${PLAYLISTS.length}개`)).toBeTruthy();

    const list = screen.getByRole('list', { name: '플레이리스트 목록' });
    const links = within(list).getAllByRole('link');

    expect(links).toHaveLength(PLAYLISTS.length);
    expect(links[0].getAttribute('href')).toBe(`/?playlist=${PLAYLISTS[0].id}`);
  });

  it('marks the loaded playlist with its track count and playing state', () => {
    renderPage();

    const link = screen.getByRole('link', {
      name: `${currentPlaylist.title} 플레이리스트, NEWTRONOME, 2곡, 1시간 15분, 재생 중`,
    });

    expect(link.getAttribute('aria-current')).toBe('true');
    expect(screen.getAllByText('재생 중')).toHaveLength(1);
  });

  it('filters playlists by title', () => {
    renderPage();

    const input = screen.getByRole('searchbox', { name: '플레이리스트 검색' });

    fireEvent.change(input, { target: { value: 'autumn' } });

    const links = within(screen.getByRole('list', { name: '플레이리스트 목록' })).getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('aria-label')).toBe('Autumn Disco 플레이리스트, NEWTRONOME');
    expect(screen.getByText(`1 / ${PLAYLISTS.length}개`)).toBeTruthy();

    fireEvent.change(input, { target: { value: '없는 제목' } });

    expect(screen.queryByRole('list', { name: '플레이리스트 목록' })).toBeNull();
    expect(screen.getByText('“없는 제목”에 맞는 플레이리스트가 없습니다.')).toBeTruthy();
  });
});
