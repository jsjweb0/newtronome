import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SoundCloudWidget from './SoundCloudWidget';

describe('SoundCloudWidget', () => {
  it('keeps the hidden player iframe out of the Tab order', () => {
    render(
      <SoundCloudWidget
        playlistUrl="https://soundcloud.com/example/sets/playlist"
        controller={{ iframeRef: vi.fn(), isReady: true }}
      />
    );

    expect(screen.getByTitle('SoundCloud 플레이리스트').getAttribute('tabindex')).toBe('-1');
  });
});
