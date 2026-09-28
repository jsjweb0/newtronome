import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PlayerBar from './PlayerBar';
import { usePlayerStore } from '../../features/player/stores/usePlayerStore';
import type { useSoundCloudWidget } from '../../features/player/hooks/useSoundCloudWidget';
import type { PlayerTrack } from '../../features/player/types/player.types';

vi.mock('../../contexts/DarkModeContext', () => ({
  useDarkMode: () => ({ isDarkMode: false }),
}));

vi.mock('../ui/Tooltip', () => ({
  default: ({ children }: PropsWithChildren) => children,
}));

vi.mock('../../features/bookmarks/components/TrackBookmarkButton', () => ({
  default: () => null,
}));

const currentTrack: PlayerTrack = {
  id: 'bookmark-1',
  title: 'Saved track',
  artist: 'Saved artist',
  artworkUrl: null,
  permalinkUrl: 'https://soundcloud.com/example/saved-track',
  durationMs: 200_000,
  genre: 'Nu Disco',
  tags: [],
};

const soundCloudWidget = {
  toggle: vi.fn(),
  seek: vi.fn(),
  toggleMute: vi.fn(),
  rewindToStart: vi.fn(),
  previousTrack: vi.fn(),
  nextTrack: vi.fn(),
  playRandomTrack: vi.fn(),
} as unknown as ReturnType<typeof useSoundCloudWidget>;

function renderPlayerBar(widget = soundCloudWidget) {
  return render(
    <PlayerBar
      onPanelToggle={vi.fn()}
      collapsed={true}
      soundCloudWidget={widget}
    />
  );
}

describe('PlayerBar bookmark controls', () => {
  beforeEach(() => {
    usePlayerStore.setState({
      currentTrack,
      playbackMode: 'bookmark',
      isPlaying: true,
      currentTime: 10,
      duration: 200,
      isMuted: false,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('disables playlist-only controls during saved-track playback', () => {
    renderPlayerBar();

    const previousButton = screen.getByRole('button', {
      name: '북마크 단일 재생 중에는 이전 트랙을 사용할 수 없습니다',
    });
    const nextButton = screen.getByRole('button', {
      name: '북마크 단일 재생 중에는 다음 트랙을 사용할 수 없습니다',
    });
    const randomButton = screen.getByRole('button', {
      name: '북마크 단일 재생 중에는 임의 재생을 사용할 수 없습니다',
    });

    expect((previousButton as HTMLButtonElement).disabled).toBe(true);
    expect((nextButton as HTMLButtonElement).disabled).toBe(true);
    expect((randomButton as HTMLButtonElement).disabled).toBe(true);
  });

  it('disables playback controls during a Widget error without adding a retry button', () => {
    usePlayerStore.setState({ playbackMode: 'playlist', isPlaying: false });
    const widgetWithError = {
      ...soundCloudWidget,
      widgetError: 'SoundCloud를 불러오지 못했습니다.',
      playlistStatus: 'error',
    } as ReturnType<typeof useSoundCloudWidget>;
    renderPlayerBar(widgetWithError);

    const controlNames = [
      '재생',
      '이전 트랙',
      '다음 트랙',
      '임의의 트랙 재생',
      '재생시간 처음으로',
      '소리 끔',
    ];

    for (const name of controlNames) {
      expect((screen.getByRole('button', { name }) as HTMLButtonElement).disabled).toBe(true);
    }
    expect((screen.getByRole('slider') as HTMLInputElement).disabled).toBe(true);
    expect(screen.queryByRole('button', { name: '다시 시도' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '재생' }));
    expect(soundCloudWidget.toggle).not.toHaveBeenCalled();
  });

  it('enables playback controls again after the Widget error clears', () => {
    usePlayerStore.setState({ playbackMode: 'playlist', isPlaying: false });
    const widgetWithError = {
      ...soundCloudWidget,
      widgetError: 'SoundCloud를 불러오지 못했습니다.',
      playlistStatus: 'error',
    } as ReturnType<typeof useSoundCloudWidget>;
    const { rerender } = renderPlayerBar(widgetWithError);

    expect((screen.getByRole('button', { name: '재생' }) as HTMLButtonElement).disabled).toBe(true);

    rerender(
      <PlayerBar
        onPanelToggle={vi.fn()}
        collapsed={true}
        soundCloudWidget={{ ...soundCloudWidget, widgetError: null, playlistStatus: 'ready' }}
      />
    );

    expect((screen.getByRole('button', { name: '재생' }) as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByRole('slider') as HTMLInputElement).disabled).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: '재생' }));
    expect(soundCloudWidget.toggle).toHaveBeenCalledTimes(1);
  });

  it('does not show the previous track after the playlist becomes empty', () => {
    usePlayerStore.setState({ playbackMode: 'playlist' });
    usePlayerStore.getState().setPlaylist([]);
    const { container } = renderPlayerBar({
      ...soundCloudWidget,
      widgetError: null,
      playlistStatus: 'empty',
    });

    expect(screen.queryByText(currentTrack.title)).toBeNull();
    expect(screen.queryByRole('button', { name: '재생' })).toBeNull();
    expect(container.firstChild).toBeNull();
  });
});
