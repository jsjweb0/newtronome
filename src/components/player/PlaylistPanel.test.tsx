import { cleanup, render, screen } from '@testing-library/react';
import { createRef, type ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { useSoundCloudWidget } from '../../features/player/hooks/useSoundCloudWidget';
import PlaylistPanel from './PlaylistPanel';

vi.mock('../layout/HeaderButtons', () => ({ default: () => null }));
vi.mock('../../features/player/components/SoundCloudWidget', () => ({ default: () => null }));
vi.mock('../../features/bookmarks/components/TrackBookmarkButton', () => ({ default: () => null }));

afterEach(() => {
  cleanup();
});

const createPanelProps = (): ComponentProps<typeof PlaylistPanel> => ({
  playlistUrl: 'https://soundcloud.com/example/sets/playlist',
  tracks: [],
  onSelect: vi.fn(),
  collapsed: true,
  isPlaying: false,
  isPlaylistMode: true,
  soundCloudWidget: {
    widgetTrack: null,
    playlistStatus: 'loading',
    widgetError: null,
    retryLoad: vi.fn(),
    toggle: vi.fn(),
  } as unknown as ReturnType<typeof useSoundCloudWidget>,
  isModal: false,
  onClose: vi.fn(),
  toggleButtonRef: createRef<HTMLButtonElement>(),
});

describe('PlaylistPanel loading state', () => {
  it('renders the loading status outside the ordered list with readable text color', () => {
    render(<PlaylistPanel {...createPanelProps()} />);

    const status = screen.getByRole('status', { name: '' });
    expect(status.textContent).toContain('플레이리스트 불러오는 중...');
    expect(status.closest('ol')).toBeNull();
    expect(status.classList.contains('text-textBase')).toBe(true);
  });

  it('keeps loaded tracks and their count visible while playback reloads the playlist', () => {
    const props = createPanelProps();
    props.tracks = [{
      id: 1,
      title: 'Queued Track',
      artist: 'Artist',
      artworkUrl: null,
      permalinkUrl: null,
      durationMs: 1000,
      genre: '',
      tags: [],
    }];
    const { rerender } = render(
      <PlaylistPanel {...props} soundCloudWidget={{ ...props.soundCloudWidget, playlistStatus: 'ready' }} />
    );
    const trackButton = screen.getByRole('button', { name: /Queued Track/ });

    rerender(<PlaylistPanel {...props} />);

    expect(screen.getByRole('button', { name: /Queued Track/ })).toBe(trackButton);
    expect(screen.getByText('1곡')).toBeTruthy();
    expect(screen.queryByText('플레이리스트 불러오는 중...')).toBeNull();
  });
});
