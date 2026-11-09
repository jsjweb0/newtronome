import { vi } from 'vitest';
import type { PlayerOutletContext } from '../../layouts/MainLayout';

/** 테스트용 레이아웃 Outlet context */
export const createOutletContext = (): PlayerOutletContext => ({
  isSidebarCollapsed: false,
  playlistUrl: 'https://soundcloud.com/ssu-1/sets/m3stc8ixvqcw',
  currentPlaylistId: 'm3stc8ixvqcw',
  onPlayPlaylist: vi.fn(),
  onSelectTrack: vi.fn(),
  onToggleTrack: vi.fn(),
  onPauseSoundCloud: vi.fn(),
  onPlaySingleTrack: vi.fn(),
  playlistStatus: 'ready',
  widgetError: null,
  retryLoad: vi.fn(),
});

export const fakeSound = (id: number, title: string, artworkUrl: string | null = null) => ({
  id,
  title,
  user: { username: 'Artist' },
  artwork_url: artworkUrl,
  permalink_url: `https://soundcloud.com/artist/${id}`,
  duration: 3 * 60 * 1000,
  policy: 'ALLOW',
  playable: true,
});

/**
 * window.SC 가짜 위젯. READY를 바로 보내고 getSounds로 sounds를 돌려준다.
 * sounds가 'error'면 ERROR 이벤트를 보낸다.
 */
export function installFakeSoundCloud(sounds: unknown[] | 'error') {
  const widgets: Array<{ getSounds: ReturnType<typeof vi.fn> }> = [];

  window.SC = {
    Widget: Object.assign(
      () => {
        const listeners: Record<string, (event?: unknown) => void> = {};
        const widget = {
          bind: vi.fn((name: string, listener: (event?: unknown) => void) => {
            listeners[name] = listener;
            if (name === 'ready' && sounds !== 'error') queueMicrotask(() => listener());
            if (name === 'error' && sounds === 'error') queueMicrotask(() => listener());
          }),
          unbind: vi.fn(),
          getSounds: vi.fn((callback: (value: unknown) => void) => callback(sounds)),
          load: vi.fn(),
          play: vi.fn(),
          pause: vi.fn(),
          toggle: vi.fn(),
          next: vi.fn(),
          prev: vi.fn(),
          skip: vi.fn(),
          seekTo: vi.fn(),
          setVolume: vi.fn(),
          getVolume: vi.fn(),
          getDuration: vi.fn(),
          getPosition: vi.fn(),
          getCurrentSound: vi.fn(),
          getCurrentSoundIndex: vi.fn(),
          isPaused: vi.fn(),
        };
        widgets.push(widget);
        return widget;
      },
      {
        Events: {
          READY: 'ready',
          PLAY: 'play',
          PAUSE: 'pause',
          FINISH: 'finish',
          SEEK: 'seek',
          LOAD_PROGRESS: 'loadProgress',
          PLAY_PROGRESS: 'playProgress',
          ERROR: 'error',
        },
      }
    ),
  };

  return widgets;
}
