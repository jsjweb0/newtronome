import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PlaylistDetailPage from './PlaylistDetailPage';
import { usePlayerStore } from '../../player/stores/usePlayerStore';
import type { PlayerTrack } from '../../player/types/player.types';
import { createOutletContext, fakeSound, installFakeSoundCloud } from '../test-utils';

const { showToast } = vi.hoisted(() => ({ showToast: vi.fn() }));

vi.mock('../../../components/ui/Slider', () => ({
  default: ({ images }: { images: string[] }) => <div data-testid="slider">{images.length}</div>,
}));

vi.mock('../../../components/track/TrackItemActions', () => ({ default: () => null }));
vi.mock('../../../contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('../../../contexts/ToastContext', () => ({ useToast: () => ({ showToast }) }));

const playlistTrack: PlayerTrack = {
  id: 99,
  title: 'Main Playlist Song',
  artist: 'Someone',
  artworkUrl: null,
  permalinkUrl: null,
  durationMs: 1000,
  genre: '',
  tags: [],
};

function renderAt(pathname: string, context = createOutletContext()) {
  const view = render(
    <MemoryRouter initialEntries={[pathname]}>
      <Routes>
        <Route element={<Outlet context={context} />}>
          <Route path="/playlists/:playlistId" element={<PlaylistDetailPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

  return { ...view, context };
}

describe('PlaylistDetailPage', () => {
  beforeEach(() => {
    showToast.mockClear();
    usePlayerStore.setState({
      tracks: [playlistTrack],
      currentTrack: playlistTrack,
      playbackMode: 'playlist',
      isPlaying: true,
      currentTime: 10,
      duration: 100,
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    delete window.SC;
  });

  it('looks up the playlist by URL id and shows its info and track list', async () => {
    installFakeSoundCloud([
      fakeSound(1, 'First Song', 'https://i1.sndcdn.com/artworks-a-large.jpg'),
      fakeSound(2, 'Second Song'),
    ]);
    const { container } = renderAt('/playlists/2024-spring');

    expect(
      await screen.findByRole('heading', { level: 1, name: '2024 입하 디스코' })
    ).toBeTruthy();
    expect(screen.getByText('2 Tracks')).toBeTruthy();
    expect(screen.getByTestId('slider').textContent).toBe('1');
    expect(container.querySelector('[data-generated-cover]')).toBeNull();
    expect(screen.getByText('6분')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Track List' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /First Song/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Second Song/ })).toBeTruthy();

    expect(
      screen.getByRole('link', { name: 'SoundCloud에서 듣기 (새 창)' }).getAttribute('href')
    ).toBe('https://soundcloud.com/ssu-1/sets/2024-spring');
    expect(screen.getByText('newtronome')).toBeTruthy();
    // updatedAt이 없으면 날짜 부분은 숨김
    expect(screen.queryByText(/업데이트/)).toBeNull();
    expect(screen.getByRole('link', { name: '목록으로' }).getAttribute('href')).toBe('/playlists');

    const frame = container.querySelector('iframe');
    expect(decodeURIComponent(frame?.getAttribute('src') ?? '')).toContain(
      'url=https://soundcloud.com/ssu-1/sets/2024-spring'
    );
  });

  it('shows the generated cover when no tracks have artwork', async () => {
    installFakeSoundCloud([fakeSound(1, 'First Song')]);
    const { container } = renderAt('/playlists/2024-spring');

    await screen.findByRole('heading', { level: 1, name: '2024 입하 디스코' });

    expect(container.querySelector('[data-generated-cover]')?.textContent).toContain('2024 입하 디스코');
    expect(screen.queryByTestId('slider')).toBeNull();
  });

  it('plays a clicked track on its own without replacing the current playlist', async () => {
    installFakeSoundCloud([fakeSound(1, 'First Song')]);
    const { context } = renderAt('/playlists/2024-spring');

    fireEvent.click(await screen.findByRole('button', { name: /First Song/ }));

    expect(context.onPlaySingleTrack).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, title: 'First Song' }),
      expect.objectContaining({ onResolved: expect.any(Function), onFailure: expect.any(Function) })
    );
    expect(context.onSelectTrack).not.toHaveBeenCalled();

    const state = usePlayerStore.getState();
    expect(state.tracks).toEqual([playlistTrack]);
    expect(state.currentTime).toBe(10);
  });

  it('shows the single track failure message when the player reports a missing track URL', async () => {
    installFakeSoundCloud([{ ...fakeSound(1, 'First Song'), permalink_url: null }]);
    const context = createOutletContext();
    vi.mocked(context.onPlaySingleTrack).mockImplementationOnce((track, options) => {
      expect(track.permalinkUrl).toBeNull();
      options?.onFailure?.();
    });
    renderAt('/playlists/2024-spring', context);

    fireEvent.click(await screen.findByRole('button', { name: /First Song/ }));

    expect(showToast).toHaveBeenCalledWith({
      message: '곡 상태를 확인하지 못했습니다.',
      type: 'error',
    });
  });

  it('marks a track as unavailable when the main player resolves it as blocked', async () => {
    installFakeSoundCloud([fakeSound(1, 'First Song')]);
    const { context } = renderAt('/playlists/2024-spring');

    fireEvent.click(await screen.findByRole('button', { name: /First Song/ }));
    const [track, options] = vi.mocked(context.onPlaySingleTrack).mock.calls[0];
    act(() => options?.onResolved?.({ ...track, playbackStatus: 'blocked' }));

    expect(screen.getByText('재생 불가')).toBeTruthy();
    const blockedButton = screen.getByRole('button', { name: /First Song/ });
    expect(blockedButton.hasAttribute('disabled')).toBe(true);
    expect(showToast).toHaveBeenCalledWith({
      message: '재생할 수 없는 곡입니다.',
      type: 'warning',
    });
  });

  it('asks the main player to play the whole playlist', async () => {
    installFakeSoundCloud([fakeSound(1, 'First Song')]);
    const { context } = renderAt('/playlists/2024-spring');

    fireEvent.click(await screen.findByRole('button', { name: '전체 재생' }));

    expect(context.onPlayPlaylist).toHaveBeenCalledWith('2024-spring');
  });

  it('shows a retry state when the tracks cannot be loaded', async () => {
    installFakeSoundCloud('error');
    renderAt('/playlists/2024-spring');

    expect(await screen.findByText('플레이리스트 곡 목록을 불러오지 못했습니다.')).toBeTruthy();
  });

  it.each([
    {
      label: 'partially valid',
      response: [fakeSound(1, 'First Song'), fakeSound(2, '')],
      message: '플레이리스트 곡 목록을 불러오지 못했습니다.',
    },
    {
      label: 'entirely invalid',
      response: [fakeSound(1, '')],
      message: '플레이리스트 곡 목록을 불러오지 못했습니다.',
    },
    { label: 'empty', response: [], message: '플레이리스트가 비어 있어요' },
  ])('handles a $label response after retrying', async ({ response, message }) => {
    vi.useFakeTimers();
    const widgets = installFakeSoundCloud(response);
    renderAt('/playlists/2024-spring');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });

    expect(widgets[0].getSounds).toHaveBeenCalledTimes(13);
    expect(screen.getByText(message)).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Track List' })).toBeNull();
  });

  it('shows a not-found message with a link back to the list for an unknown id', () => {
    installFakeSoundCloud([]);
    const { container } = renderAt('/playlists/does-not-exist');

    expect(
      screen.getByRole('heading', { level: 1, name: '플레이리스트를 찾을 수 없습니다' })
    ).toBeTruthy();
    expect(
      screen.getByRole('link', { name: '플레이리스트 목록 보기' }).getAttribute('href')
    ).toBe('/playlists');
    expect(container.querySelector('iframe')).toBeNull();
  });
});
