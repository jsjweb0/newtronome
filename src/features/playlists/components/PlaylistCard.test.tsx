import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import PlaylistCard from './PlaylistCard';
import type { Playlist } from '../data/playlists';

const playlist: Playlist = {
  id: '2024-spring',
  soundCloudUrl: 'https://soundcloud.com/ssu-1/sets/2024-spring',
  title: '2024 입하 디스코',
  coverUrl: 'https://i1.sndcdn.com/artworks-example-t500x500.jpg',
};

const renderCard = (card: Playlist = playlist) =>
  render(
    <MemoryRouter>
      <PlaylistCard playlist={card} />
    </MemoryRouter>
  );

afterEach(() => {
  cleanup();
});

describe('PlaylistCard', () => {
  it('makes the whole card one link to the playlist detail', () => {
    renderCard();

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('aria-label')).toBe('2024 입하 디스코 플레이리스트, NEWTRONOME');
    expect(links[0].getAttribute('href')).toBe('/playlists/2024-spring');
    expect(links[0].className).toContain('focus-visible:outline-primary');
  });

  it('swaps in the fallback image when the cover fails to load', () => {
    const { container } = renderCard();
    const image = container.querySelector('img');

    expect(image?.getAttribute('src')).toBe(playlist.coverUrl);

    fireEvent.error(image!);

    expect(image?.getAttribute('src')).toContain('no-image');
  });

  it('shows the title on a theme background when there is no cover', () => {
    const { container } = renderCard({ ...playlist, coverUrl: null });

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getAllByText('2024 입하 디스코')).toHaveLength(2);
  });
});
