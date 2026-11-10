import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SoundCloudWidget from './SoundCloudWidget';

afterEach(cleanup);

describe('SoundCloudWidget', () => {
  it('keeps the hidden player iframe out of the Tab order', () => {
    render(
      <SoundCloudWidget
        playlistUrl="https://soundcloud.com/example/sets/playlist"
        controller={{ iframeRef: vi.fn(), isReady: true, frameVersion: 0 }}
      />
    );

    expect(screen.getByTitle('SoundCloud 플레이리스트').getAttribute('tabindex')).toBe('-1');
  });

  it('replaces the iframe when the frame version changes without changing the playlist URL', () => {
    const playlistUrl = 'https://soundcloud.com/example/sets/playlist';
    const controller = { iframeRef: vi.fn(), isReady: true, frameVersion: 0 };
    const { rerender } = render(<SoundCloudWidget playlistUrl={playlistUrl} controller={controller} />);
    const firstFrame = screen.getByTitle('SoundCloud 플레이리스트');

    rerender(<SoundCloudWidget playlistUrl={playlistUrl} controller={controller} />);
    expect(screen.getByTitle('SoundCloud 플레이리스트')).toBe(firstFrame);

    rerender(
      <SoundCloudWidget playlistUrl={playlistUrl} controller={{ ...controller, frameVersion: 1 }} />
    );
    const nextFrame = screen.getByTitle('SoundCloud 플레이리스트');

    expect(nextFrame).not.toBe(firstFrame);
    expect(nextFrame.getAttribute('src')).toBe(firstFrame.getAttribute('src'));
  });
});
