import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PlayerTrack } from '../../player/types/player.types';
import { useTrackBookmark } from '../hooks/useTrackBookmark';
import { removeSavedTrack, saveTrack, subscribeToSavedTrack } from '../services/savedTracks';
import TrackBookmarkButton from './TrackBookmarkButton';
import { usePlayerStore } from '../../player/stores/usePlayerStore';

const mocks = vi.hoisted(() => ({
  user: { uid: 'user-1' } as { uid: string } | null,
  showToast: vi.fn(),
}));

vi.mock('../../../contexts/AuthContext', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('../../../contexts/ToastContext', () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
vi.mock('../services/savedTracks', () => ({
  subscribeToSavedTrack: vi.fn(),
  saveTrack: vi.fn(),
  removeSavedTrack: vi.fn(),
}));

const track: PlayerTrack = {
  id: 1, title: '테스트 트랙', artist: '아티스트', artworkUrl: null,
  permalinkUrl: null, durationMs: 1000, genre: '', tags: [],
};

type Subscription = {
  onSuccess: Parameters<typeof subscribeToSavedTrack>[2];
  onError: Parameters<typeof subscribeToSavedTrack>[3];
  unsubscribe: ReturnType<typeof vi.fn>;
};
let subscriptions: Subscription[];

beforeEach(() => {
  vi.resetAllMocks();
  mocks.user = { uid: 'user-1' };
  subscriptions = [];
  vi.mocked(saveTrack).mockResolvedValue(undefined);
  vi.mocked(removeSavedTrack).mockResolvedValue(undefined);
  vi.mocked(subscribeToSavedTrack).mockImplementation((_uid, _id, onSuccess, onError) => {
    const unsubscribe = vi.fn();
    subscriptions.push({ onSuccess, onError, unsubscribe });
    return unsubscribe;
  });
});

afterEach(cleanup);

describe('TrackBookmarkButton subscription failures', () => {
  it('clears a previously filled heart on failure, retries without writing, then recovers', async () => {
    render(<TrackBookmarkButton track={track} />);
    const button = screen.getByRole<HTMLButtonElement>('button', { name: '북마크 상태 확인 중' });
    expect(button.disabled).toBe(true);
    act(() => subscriptions[0].onSuccess(true));
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.querySelector('svg')?.classList.contains('fill-primary')).toBe(true);

    act(() => subscriptions[0].onError(new Error('권한 오류')));
    expect(screen.getByRole('button', { name: '북마크 상태를 확인하지 못했습니다. 다시 시도' })).toBe(button);
    expect(button.disabled).toBe(false);
    expect(button.hasAttribute('aria-pressed')).toBe(false);
    expect(button.querySelector('svg')?.classList.contains('fill-primary')).toBe(false);
    expect(mocks.showToast).not.toHaveBeenCalled();

    fireEvent.click(button);
    expect(mocks.showToast).toHaveBeenCalledWith({
      message: '북마크 상태를 확인하지 못해 다시 조회합니다.', type: 'error',
    });
    expect(subscriptions[0].unsubscribe).toHaveBeenCalledTimes(1);
    expect(subscribeToSavedTrack).toHaveBeenCalledTimes(2);
    expect(button.disabled).toBe(true);
    expect(saveTrack).not.toHaveBeenCalled();
    expect(removeSavedTrack).not.toHaveBeenCalled();

    act(() => subscriptions[1].onSuccess(true));
    expect(screen.getByRole('button', { name: '북마크 삭제' })).toBe(button);
    expect(button.disabled).toBe(false);
    expect(button.getAttribute('title')).toBe('북마크 삭제');
    expect(button.querySelector('svg')?.classList.contains('fill-primary')).toBe(true);
    await act(async () => { fireEvent.click(button); });
    expect(removeSavedTrack).toHaveBeenCalledWith('user-1', track.id);
  });

  it('allows repeated retries and saves only after a successful unsaved result', async () => {
    render(<TrackBookmarkButton track={track} />);
    for (const index of [0, 1]) {
      act(() => subscriptions[index].onError(new Error('조회 실패')));
      fireEvent.click(screen.getByRole('button', { name: /다시 시도/ }));
      expect(subscriptions[index].unsubscribe).toHaveBeenCalledTimes(1);
    }
    expect(subscribeToSavedTrack).toHaveBeenCalledTimes(3);
    expect(saveTrack).not.toHaveBeenCalled();
    expect(removeSavedTrack).not.toHaveBeenCalled();
    act(() => subscriptions[2].onSuccess(false));
    const button = screen.getByRole('button', { name: '북마크 추가' });
    expect(button.getAttribute('aria-pressed')).toBe('false');
    await act(async () => { fireEvent.click(button); });
    expect(saveTrack).toHaveBeenCalledWith('user-1', track);
  });

  it('unsubscribes on track changes and unmount, clearing the previous error', () => {
    const { rerender, unmount } = render(<TrackBookmarkButton track={track} />);
    act(() => subscriptions[0].onError(new Error('조회 실패')));
    rerender(<TrackBookmarkButton track={{ ...track, id: 2 }} />);
    expect(subscriptions[0].unsubscribe).toHaveBeenCalledTimes(1);
    expect(subscribeToSavedTrack).toHaveBeenLastCalledWith('user-1', 2, expect.any(Function), expect.any(Function));
    expect(screen.queryByRole('button', { name: /다시 시도/ })).toBeNull();
    expect(screen.getByRole<HTMLButtonElement>('button', { name: '북마크 상태 확인 중' }).disabled).toBe(true);
    act(() => subscriptions[1].onSuccess(false));
    unmount();
    expect(subscriptions[1].unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes on account changes and logout, restoring the login prompt', () => {
    const { rerender } = render(<TrackBookmarkButton track={track} />);
    mocks.user = { uid: 'user-2' };
    rerender(<TrackBookmarkButton track={track} />);
    expect(subscriptions[0].unsubscribe).toHaveBeenCalledTimes(1);
    expect(subscribeToSavedTrack).toHaveBeenLastCalledWith('user-2', track.id, expect.any(Function), expect.any(Function));
    act(() => subscriptions[1].onError(new Error('조회 실패')));
    mocks.user = null;
    rerender(<TrackBookmarkButton track={track} />);
    expect(subscriptions[1].unsubscribe).toHaveBeenCalledTimes(1);
    expect(subscribeToSavedTrack).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole('button', { name: '북마크 추가' }));
    expect(mocks.showToast).toHaveBeenCalledWith({
      message: '로그인 후 북마크할 수 있습니다.',
      type: 'info',
      action: { label: '로그인', to: '/login' },
    });
    expect(saveTrack).not.toHaveBeenCalled();
    expect(removeSavedTrack).not.toHaveBeenCalled();
  });

  it('guards writes inside the hook during loading and after subscription failure', async () => {
    const { result } = renderHook(() => useTrackBookmark(track));
    await act(async () => { await result.current.toggleBookmark(); });
    act(() => subscriptions[0].onError(new Error('조회 실패')));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('북마크 상태를 확인하지 못했습니다.');
    await act(async () => { await result.current.toggleBookmark(); });
    expect(saveTrack).not.toHaveBeenCalled();
    expect(removeSavedTrack).not.toHaveBeenCalled();
  });

  it('keeps SoundCloud playback state when Firebase bookmark lookup fails', () => {
    usePlayerStore.setState({
      playbackMode: 'single',
      currentTrack: track,
      isPlaying: true,
      currentTime: 12,
      duration: 60,
    });
    render(<TrackBookmarkButton track={track} />);

    act(() => subscriptions[0].onError(new Error('Firestore unavailable')));

    expect(screen.getByRole('button', { name: /북마크 상태를 확인하지 못했습니다/ })).toBeTruthy();
    expect(usePlayerStore.getState()).toMatchObject({
      playbackMode: 'single',
      currentTrack: track,
      isPlaying: true,
      currentTime: 12,
      duration: 60,
    });
    expect(saveTrack).not.toHaveBeenCalled();
    expect(removeSavedTrack).not.toHaveBeenCalled();
  });
});

describe('TrackBookmarkButton playback restrictions', () => {
  const blockedTrack: PlayerTrack = { ...track, playbackStatus: 'blocked' };

  it('disables adding a blocked track and explains why', () => {
    render(<TrackBookmarkButton track={blockedTrack} />);
    act(() => subscriptions[0].onSuccess(false));

    const button = screen.getByRole<HTMLButtonElement>('button', {
      name: '재생 불가 곡은 북마크에 추가할 수 없습니다',
    });
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('title')).toBe('재생 불가 곡은 북마크에 추가할 수 없습니다');
    fireEvent.click(button);
    expect(saveTrack).not.toHaveBeenCalled();
    expect(removeSavedTrack).not.toHaveBeenCalled();
  });

  it('prevents saving a blocked track even when the hook is called directly', async () => {
    const { result } = renderHook(() => useTrackBookmark(blockedTrack));
    act(() => subscriptions[0].onSuccess(false));

    await act(async () => { await result.current.toggleBookmark(); });

    expect(saveTrack).not.toHaveBeenCalled();
    expect(removeSavedTrack).not.toHaveBeenCalled();
    expect(mocks.showToast).toHaveBeenCalledWith({
      message: '재생할 수 없는 곡은 북마크에 추가할 수 없습니다.',
      type: 'warning',
    });
  });

  it('allows removing a blocked track that is already bookmarked', async () => {
    render(<TrackBookmarkButton track={blockedTrack} />);
    act(() => subscriptions[0].onSuccess(true));

    const button = screen.getByRole<HTMLButtonElement>('button', { name: '북마크 삭제' });
    expect(button.disabled).toBe(false);
    await act(async () => { fireEvent.click(button); });

    expect(removeSavedTrack).toHaveBeenCalledWith('user-1', track.id);
    expect(saveTrack).not.toHaveBeenCalled();
  });

  it('allows bookmarking a preview track', async () => {
    const previewTrack: PlayerTrack = { ...track, playbackStatus: 'preview' };
    render(<TrackBookmarkButton track={previewTrack} />);
    act(() => subscriptions[0].onSuccess(false));

    const button = screen.getByRole<HTMLButtonElement>('button', { name: '북마크 추가' });
    expect(button.disabled).toBe(false);
    await act(async () => { fireEvent.click(button); });

    expect(saveTrack).toHaveBeenCalledWith('user-1', previewTrack);
  });
});
