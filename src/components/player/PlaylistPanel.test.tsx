import { cleanup, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { useSoundCloudWidget } from '../../features/player/hooks/useSoundCloudWidget';
import PlaylistPanel from './PlaylistPanel';

vi.mock('../layout/HeaderButtons', () => ({ default: () => null }));
vi.mock('../../features/player/components/SoundCloudWidget', () => ({ default: () => null }));
vi.mock('../../features/bookmarks/components/TrackBookmarkButton', () => ({ default: () => null }));

afterEach(() => {
  cleanup();
});

describe('PlaylistPanel loading state', () => {
  it('renders the loading status outside the ordered list with readable text color', () => {
    const soundCloudWidget = {
      widgetTrack: null,
      playlistStatus: 'loading',
      widgetError: null,
      retryLoad: vi.fn(),
      toggle: vi.fn(),
    } as unknown as ReturnType<typeof useSoundCloudWidget>;

    render(
      <PlaylistPanel
        playlistUrl="https://soundcloud.com/example/sets/playlist"
        tracks={[]}
        onSelect={vi.fn()}
        collapsed={true}
        isPlaying={false}
        isPlaylistMode={true}
        soundCloudWidget={soundCloudWidget}
        isModal={false}
        onClose={vi.fn()}
        toggleButtonRef={createRef<HTMLButtonElement>()}
      />
    );

    const status = screen.getByRole('status', { name: '' });
    expect(status.textContent).toContain('플레이리스트 불러오는 중...');
    expect(status.closest('ol')).toBeNull();
    expect(status.classList.contains('text-textBase')).toBe(true);
  });
});
