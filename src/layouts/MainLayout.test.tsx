import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { MemoryRouter, Route, Routes, useOutletContext } from 'react-router-dom';
import type { PlayerOutletContext } from './MainLayout';
import { usePlayerStore } from '../features/player/stores/usePlayerStore';
import type { PlayerTrack } from '../features/player/types/player.types';
import MainLayout from './MainLayout';

const widgetMocks = vi.hoisted(() => ({
  urls: [] as string[],
  selectTrack: vi.fn(),
  toggle: vi.fn(),
}));

vi.mock('../features/player/hooks/useSoundCloudWidget', () => ({
  useSoundCloudWidget: (playlistUrl: string) => (widgetMocks.urls.push(playlistUrl), {
    selectTrack: widgetMocks.selectTrack,
    toggle: widgetMocks.toggle,
    pause: vi.fn(),
    playSingleTrack: vi.fn(),
    retryLoad: vi.fn(),
    playlistStatus: 'ready',
    widgetError: null,
    isReady: true,
  }),
}));

vi.mock('../components/layout/Sidebar', () => ({
  default: () => <nav id="navbar" aria-label="주요 메뉴" />,
}));
vi.mock('../components/layout/PlayerBar', () => ({ default: () => <div /> }));
vi.mock('../components/layout/PlayerBarSkeleton', () => ({ default: () => <div /> }));
vi.mock('../components/player/PlaylistPanel', () => ({ default: () => <aside /> }));
vi.mock('../components/DarkModeToggle', () => ({ default: () => <button type="button">테마</button> }));
vi.mock('../components/ui/Tooltip', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

const track = (id: number, playbackStatus: PlayerTrack['playbackStatus']): PlayerTrack => ({
  id,
  title: `Track ${id}`,
  artist: 'Artist',
  artworkUrl: null,
  permalinkUrl: null,
  durationMs: 1000,
  genre: '',
  tags: [],
  playbackStatus,
});

function PlayButton({ playlistId }: { playlistId: string }) {
  const { currentPlaylistId, onPlayPlaylist } = useOutletContext<PlayerOutletContext>();

  return (
    <>
      <p>현재: {currentPlaylistId}</p>
      <button type="button" onClick={() => onPlayPlaylist(playlistId)}>
        전체 재생
      </button>
    </>
  );
}

const renderWithPlayButton = (playlistId: string) =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<PlayButton playlistId={playlistId} />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

describe('MainLayout', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('provides the first keyboard link to the main content', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<div>페이지 본문</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const skipLink = screen.getByRole('link', { name: '본문 바로가기' });
    const mainContent = container.querySelector('#main-content');

    expect(container.querySelector('a')).toBe(skipLink);
    expect(skipLink.getAttribute('href')).toBe('#main-content');
    expect(mainContent?.getAttribute('tabindex')).toBe('-1');
    expect(mainContent?.textContent).toContain('페이지 본문');
  });

  it('connects the desktop sidebar toggle to the controlled navigation', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<div>페이지 본문</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const closeButton = screen.getByRole('button', { name: 'Close sidebar' });

    expect(closeButton.getAttribute('aria-controls')).toBe('navbar');
    expect(closeButton.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById('navbar')).not.toBeNull();

    fireEvent.click(closeButton);

    const openButton = screen.getByRole('button', { name: 'Open sidebar' });
    expect(openButton.getAttribute('aria-controls')).toBe('navbar');
    expect(openButton.getAttribute('aria-expanded')).toBe('false');
  });

  it('switches the main player to another playlist and plays its first playable track', () => {
    widgetMocks.urls.length = 0;
    widgetMocks.selectTrack.mockClear();
    vi.spyOn(Math, 'random').mockReturnValue(0); // 처음엔 PLAYLISTS[0] (2025-summer)
    usePlayerStore.setState({ tracks: [track(9, 'allowed')], playbackMode: 'single', isPlaying: true });

    renderWithPlayButton('autumn-disco');
    fireEvent.click(screen.getByRole('button', { name: '전체 재생' }));

    expect(screen.getByText('현재: autumn-disco')).toBeTruthy();
    expect(widgetMocks.urls[widgetMocks.urls.length - 1]).toBe('https://soundcloud.com/ssu-1/sets/autumn-disco');
    expect(usePlayerStore.getState().tracks).toEqual([]);
    expect(usePlayerStore.getState().playbackMode).toBe('playlist');
    expect(widgetMocks.selectTrack).not.toHaveBeenCalled();

    // 새 플레이리스트 곡이 들어오면 재생 불가 곡을 건너뛰고 첫 곡 재생
    act(() => {
      usePlayerStore.setState({ tracks: [track(1, 'blocked'), track(2, 'allowed')] });
    });

    expect(widgetMocks.selectTrack).toHaveBeenCalledTimes(1);
    expect(widgetMocks.selectTrack).toHaveBeenCalledWith(1);
  });

  it('does not reload the playlist that is already loaded', () => {
    widgetMocks.urls.length = 0;
    widgetMocks.selectTrack.mockClear();
    widgetMocks.toggle.mockClear();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    usePlayerStore.setState({
      tracks: [track(1, 'allowed')],
      currentTrack: track(1, 'allowed'),
      playbackMode: 'playlist',
    });

    renderWithPlayButton('2025-summer');
    const rendersBefore = new Set(widgetMocks.urls);
    fireEvent.click(screen.getByRole('button', { name: '전체 재생' }));

    expect(widgetMocks.toggle).toHaveBeenCalledTimes(1);
    expect(widgetMocks.selectTrack).not.toHaveBeenCalled();
    expect(new Set(widgetMocks.urls)).toEqual(rendersBefore);
    expect(usePlayerStore.getState().tracks).toHaveLength(1);

    // 한 곡 재생 중이었다면 다시 불러오지 않고 이 플레이리스트 첫 곡으로
    usePlayerStore.setState({ playbackMode: 'single' });
    fireEvent.click(screen.getByRole('button', { name: '전체 재생' }));
    expect(widgetMocks.selectTrack).toHaveBeenCalledWith(0);
  });

  it.each([
    ['/playlists', '플레이리스트 | NEWTRONOME'],
    ['/playlists/2024-spring', '2024 입하 디스코 | NEWTRONOME'],
    ['/playlists/unknown', '플레이리스트를 찾을 수 없음 | NEWTRONOME'],
    ['/playlists/%E0%A4%A', '플레이리스트를 찾을 수 없음 | NEWTRONOME'],
    ['/search', '음악 검색 | NEWTRONOME'],
    ['/board/free', '자유게시판 | NEWTRONOME'],
    ['/board/notice/write', '공지사항 글쓰기 | NEWTRONOME'],
    ['/board/free/post-1', '자유게시판 게시글 상세 | NEWTRONOME'],
  ])('updates the document title for %s', (pathname, expectedTitle) => {
    render(
      <MemoryRouter initialEntries={[pathname]}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route path="*" element={<div>페이지 본문</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(document.title).toBe(expectedTitle);
  });
});
