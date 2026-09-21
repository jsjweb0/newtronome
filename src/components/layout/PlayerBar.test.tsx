import { cleanup, render, screen } from '@testing-library/react';
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
    render(
      <PlayerBar
        onPanelToggle={vi.fn()}
        collapsed={true}
        soundCloudWidget={soundCloudWidget}
      />
    );

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
});
