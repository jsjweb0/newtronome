import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PlayerTrack } from '../../features/player/types/player.types';
import TrackItem from './TrackItem';

const track: PlayerTrack = {
  id: 'track-1',
  title: 'Test track',
  artist: 'Test artist',
  artworkUrl: 'https://example.com/artwork.jpg',
  permalinkUrl: 'https://soundcloud.com/example/test-track',
  durationMs: 180_000,
  genre: 'House',
  tags: [],
};

afterEach(() => {
  cleanup();
});

describe('TrackItem accessibility', () => {
  it.each([
    { isPlaying: false, accessibleName: 'Test track 재생' },
    { isPlaying: true, accessibleName: 'Test track 일시정지' },
  ])('exposes the current playback action when isPlaying=$isPlaying', ({
    isPlaying,
    accessibleName,
  }) => {
    render(
      <TrackItem
        idx={0}
        track={track}
        currentTrack={track}
        isPlaying={isPlaying}
        onTrackClick={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: accessibleName })).toBeTruthy();
  });

  it('treats artwork as decorative because the track title is already provided', () => {
    const { container } = render(
      <TrackItem
        idx={0}
        track={track}
        currentTrack={track}
        onTrackClick={vi.fn()}
      />
    );

    expect(container.querySelector('img')?.getAttribute('alt')).toBe('');
  });
});
