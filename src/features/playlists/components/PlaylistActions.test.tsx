import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PlaylistActions from './PlaylistActions';
import type { Playlist } from '../data/playlists';

const mocks = vi.hoisted(() => ({
  user: { uid: 'user-1' } as { uid: string } | null,
  showToast: vi.fn(),
  savePlaylist: vi.fn(() => Promise.resolve()),
  removeSavedPlaylist: vi.fn(() => Promise.resolve()),
  savedCallback: null as ((isSaved: boolean) => void) | null,
}));

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mocks.user }),
}));
vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}));
vi.mock('../services/savedPlaylists', () => ({
  savePlaylist: mocks.savePlaylist,
  removeSavedPlaylist: mocks.removeSavedPlaylist,
  subscribeToSavedPlaylist: vi.fn((_uid, _id, callback: (isSaved: boolean) => void) => {
    mocks.savedCallback = callback;
    return vi.fn();
  }),
}));

const playlist: Playlist = {
  id: '2024-spring',
  soundCloudUrl: 'https://soundcloud.com/ssu-1/sets/2024-spring',
  title: '2024 입하 디스코',
  coverUrl: null,
};

const renderActions = (isPlaying = false) => {
  const onPlay = vi.fn();
  render(<PlaylistActions playlist={playlist} isPlaying={isPlaying} onPlay={onPlay} />);
  return { onPlay };
};

describe('PlaylistActions', () => {
  beforeEach(() => {
    mocks.user = { uid: 'user-1' };
    mocks.savedCallback = null;
    mocks.showToast.mockClear();
    mocks.savePlaylist.mockClear();
    mocks.removeSavedPlaylist.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, 'share');
  });

  it('renders the four buttons in design order and plays the whole playlist', () => {
    const { onPlay } = renderActions();

    const controls = screen.getAllByRole('button').map((el) => el.textContent || el.getAttribute('aria-label'));
    expect(controls[0]).toBe('전체 재생');

    const soundCloud = screen.getByRole('link', { name: 'SoundCloud에서 듣기 (새 창)' });
    expect(soundCloud.getAttribute('href')).toBe(playlist.soundCloudUrl);
    expect(soundCloud.getAttribute('target')).toBe('_blank');

    fireEvent.click(screen.getByRole('button', { name: '전체 재생' }));
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it('shows pause while this playlist is playing', () => {
    renderActions(true);
    expect(screen.getByRole('button', { name: '일시정지' })).toBeTruthy();
  });

  it('copies the playlist link when Web Share is not available', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    renderActions();

    fireEvent.click(screen.getByRole('button', { name: '공유' }));

    await waitFor(() =>
      expect(mocks.showToast).toHaveBeenCalledWith({ message: '링크가 복사되었습니다!', type: 'success' })
    );
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/playlists/2024-spring`);
  });

  it('uses Web Share when the browser supports it', async () => {
    const share = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    renderActions();

    fireEvent.click(screen.getByRole('button', { name: '공유' }));

    await waitFor(() =>
      expect(share).toHaveBeenCalledWith({
        title: '2024 입하 디스코 | NEWTRONOME',
        url: `${window.location.origin}/playlists/2024-spring`,
      })
    );
    expect(mocks.showToast).not.toHaveBeenCalled();
  });

  it('toggles the saved state for a signed-in user', async () => {
    renderActions();
    act(() => mocks.savedCallback?.(false));

    const likeButton = screen.getByRole('button', { name: '플레이리스트 저장 (좋아요)' });
    expect(likeButton.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(likeButton);
    await waitFor(() => expect(mocks.savePlaylist).toHaveBeenCalledWith('user-1', playlist));

    act(() => mocks.savedCallback?.(true));
    const savedButton = screen.getByRole('button', { name: '플레이리스트 저장 취소 (좋아요)' });
    expect(savedButton.getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(savedButton);
    await waitFor(() => expect(mocks.removeSavedPlaylist).toHaveBeenCalledWith('user-1', '2024-spring'));
  });

  it('asks a signed-out user to log in instead of saving', () => {
    mocks.user = null;
    renderActions();

    const likeButton = screen.getByRole('button', { name: '플레이리스트 저장 (좋아요)' });
    expect(likeButton.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(likeButton);

    expect(mocks.showToast).toHaveBeenCalledWith({ message: '로그인 후 이용해 주세요!', type: 'info' });
    expect(mocks.savePlaylist).not.toHaveBeenCalled();
  });
});
