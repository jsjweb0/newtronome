import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import HomePage from './HomePage';
import { usePlayerStore } from '../features/player/stores/usePlayerStore';
import type { PlayerOutletContext } from '../layouts/MainLayout';

vi.mock('../components/ui/Slider', () => ({
  default: () => <div />,
}));

type PlaylistStatus = 'loading' | 'ready' | 'empty' | 'error';

function renderHomePage(status: PlaylistStatus) {
  const retryLoad = vi.fn();
  const context = {
    isSidebarCollapsed: false,
    playlistUrl: 'https://soundcloud.com/example/sets/playlist',
    onSelectTrack: vi.fn(),
    onToggleTrack: vi.fn(),
    onPauseSoundCloud: vi.fn(),
    onPlaySingleTrack: vi.fn(),
    playlistStatus: status,
    widgetError: status === 'error' ? 'SoundCloud를 불러오지 못했습니다.' : null,
    retryLoad,
  } satisfies PlayerOutletContext & {
    playlistStatus: PlaylistStatus;
    widgetError: string | null;
    retryLoad: () => void;
  };

  const view = render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<Outlet context={context} />}>
          <Route path="/" element={<HomePage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

  return { ...view, retryLoad };
}

describe('HomePage playlist status', () => {
  beforeEach(() => {
    usePlayerStore.setState({
      tracks: [],
      currentTrack: null,
      playbackMode: 'playlist',
      isPlaying: false,
      currentTime: 0,
      duration: 0,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the skeleton only while the playlist is loading', () => {
    const { container } = renderHomePage('loading');

    expect(container.querySelector('.animate-pulse')).not.toBeNull();
  });

  it('shows an empty message after an empty playlist is confirmed', () => {
    const { container } = renderHomePage('empty');

    expect(screen.getByText('플레이리스트가 비어 있어요')).toBeTruthy();
    expect(container.querySelector('.animate-pulse')).toBeNull();
  });

  it('shows an error and lets the user retry', () => {
    const { container, retryLoad } = renderHomePage('error');

    expect(screen.getByRole('alert').textContent).toContain('SoundCloud를 불러오지 못했습니다.');
    expect(container.querySelector('.animate-pulse')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(retryLoad).toHaveBeenCalledTimes(1);
  });

  it('exposes the selected view mode with aria-pressed', () => {
    renderHomePage('ready');

    const gridButton = screen.getByRole('button', { name: '앨범형' });
    const listButton = screen.getByRole('button', { name: '목록형' });

    expect(gridButton.getAttribute('aria-pressed')).toBe('true');
    expect(listButton.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(listButton);

    expect(gridButton.getAttribute('aria-pressed')).toBe('false');
    expect(listButton.getAttribute('aria-pressed')).toBe('true');
  });

  it('keeps the track list heading in sequence after the page heading', () => {
    renderHomePage('ready');

    expect(screen.getByRole('heading', { level: 3, name: 'Track List' })).toBeTruthy();
  });
});
