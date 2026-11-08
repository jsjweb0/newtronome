import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import PlaylistDetailPage from './PlaylistDetailPage';

function renderAt(pathname: string) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <Routes>
        <Route path="/playlists/:playlistId" element={<PlaylistDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

afterEach(() => {
  cleanup();
});

describe('PlaylistDetailPage', () => {
  it('looks up the playlist from the URL id on direct access', () => {
    const { container } = renderAt('/playlists/2024-spring');

    expect(screen.getByRole('heading', { level: 1, name: '2024 입하 디스코' })).toBeTruthy();
    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      'https://i1.sndcdn.com/artworks-LPqUcC3PkfKV6wbb-MLAeyg-t500x500.jpg'
    );

    const soundCloudLink = screen.getByRole('link', {
      name: '2024 입하 디스코 SoundCloud에서 열기 (새 창)',
    });
    expect(soundCloudLink.getAttribute('href')).toBe('https://soundcloud.com/ssu-1/sets/2024-spring');
    expect(soundCloudLink.getAttribute('target')).toBe('_blank');

    expect(screen.getByRole('link', { name: '목록으로' }).getAttribute('href')).toBe('/playlists');
  });

  it('falls back to the default image when the cover fails to load', () => {
    const { container } = renderAt('/playlists/2024-spring');
    const image = container.querySelector('img')!;

    fireEvent.error(image);

    expect(image.getAttribute('src')).toContain('no-image');
  });

  it('shows the title on a theme background when there is no cover', () => {
    const { container } = renderAt('/playlists/autumn-disco');

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getAllByText('Autumn Disco')).toHaveLength(2);
  });

  it('shows a not-found message with a link back to the list for an unknown id', () => {
    renderAt('/playlists/does-not-exist');

    expect(
      screen.getByRole('heading', { level: 1, name: '플레이리스트를 찾을 수 없습니다' })
    ).toBeTruthy();
    expect(
      screen.getByRole('link', { name: '플레이리스트 목록 보기' }).getAttribute('href')
    ).toBe('/playlists');
    expect(screen.queryByRole('link', { name: /SoundCloud/ })).toBeNull();
  });
});
