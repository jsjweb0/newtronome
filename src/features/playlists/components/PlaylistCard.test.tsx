import { cleanup, render, screen } from '@testing-library/react';
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

const renderCard = (props: Partial<Parameters<typeof PlaylistCard>[0]> = {}) =>
  render(
    <MemoryRouter>
      <PlaylistCard playlist={playlist} {...props} />
    </MemoryRouter>
  );

afterEach(() => {
  cleanup();
});

describe('PlaylistCard', () => {
  it('links to the home playlist detail with a readable name', () => {
    renderCard();

    const link = screen.getByRole('link', {
      name: '2024 입하 디스코 플레이리스트, NEWTRONOME',
    });

    expect(link.getAttribute('href')).toBe('/?playlist=2024-spring');
    expect(link.getAttribute('aria-current')).toBeNull();
    expect(screen.queryByText('재생 중')).toBeNull();
  });

  it('shows track count, duration and the playing badge for the current playlist', () => {
    renderCard({ isCurrent: true, isPlaying: true, trackCount: 12, durationLabel: '44분' });

    const link = screen.getByRole('link', {
      name: '2024 입하 디스코 플레이리스트, NEWTRONOME, 12곡, 44분, 재생 중',
    });

    expect(link.getAttribute('aria-current')).toBe('true');
    expect(screen.getByText('재생 중')).toBeTruthy();
    expect(screen.getByText('12곡 · 44분')).toBeTruthy();
    expect(screen.getByText('2024 입하 디스코').className).toContain('text-primary');
  });

  it('falls back to a theme background when there is no cover', () => {
    const { container } = renderCard({ playlist: { ...playlist, coverUrl: null } });

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getAllByText('2024 입하 디스코')).toHaveLength(2);
  });
});
