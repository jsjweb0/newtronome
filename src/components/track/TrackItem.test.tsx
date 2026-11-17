import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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
    { isPlaying: false, accessibleName: 'Test track Test artist 재생' },
    { isPlaying: true, accessibleName: 'Test track Test artist 일시정지' },
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

it('disables playback without disabling sibling actions, then restores playback', () => {
  const play = vi.fn();
  const action = vi.fn();
  const props = { idx: 0, track, onTrackClick: play,
    actions: <button onClick={action}>Save track</button> };
  const { rerender } = render(<TrackItem {...props} disabled />);
  const button = screen.getByRole<HTMLButtonElement>('button', { name: /Test track.*재생/ });
  expect(button.disabled).toBe(true);
  fireEvent.click(button);
  expect(play).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Save track' }));
  expect(action).toHaveBeenCalledTimes(1);
  rerender(<TrackItem {...props} />);
  expect(button.disabled).toBe(false);
  fireEvent.click(button);
  expect(play).toHaveBeenCalledWith(track);
  rerender(<TrackItem {...props} track={{ ...track, playbackStatus: 'blocked' }} disabled={false} />);
  expect(screen.getByRole<HTMLButtonElement>('button', { name: /Test track.*재생/ }).disabled).toBe(true);
});
