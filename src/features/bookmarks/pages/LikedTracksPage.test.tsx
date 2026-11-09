import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import LikedTracksPage from './LikedTracksPage';
import type { SavedTrack } from '../types/saved-track.types';
import { usePlayerStore } from '../../player/stores/usePlayerStore';

const mocks = vi.hoisted(() => ({
  showToast: vi.fn(),
  onSuccess: undefined as ((tracks: SavedTrack[]) => void) | undefined,
  onError: undefined as ((error: Error) => void) | undefined,
}));

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'user-1' }, loading: false }),
}));
vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}));
vi.mock('../services/savedTracks', () => ({
  subscribeToSavedTracks: vi.fn((_uid, onSuccess, onError) => {
    mocks.onSuccess = onSuccess;
    mocks.onError = onError;
    return vi.fn();
  }),
  removeSavedTrack: vi.fn(),
}));

function renderLikesPage() {
  return render(
    <MemoryRouter initialEntries={['/likes']}>
      <Routes>
        <Route element={<Outlet context={{ onPlaySingleTrack: vi.fn(), onToggleTrack: vi.fn() }} />}>
          <Route path="/likes" element={<LikedTracksPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

const baseTrack: SavedTrack = {
  id: 1,
  title: '회복된 트랙',
  artist: '아티스트',
  artworkUrl: null,
  permalinkUrl: 'https://soundcloud.com/example/track',
  durationMs: 180_000,
  genre: '',
  tags: [],
  savedAt: null,
};

afterEach(() => {
  cleanup();
  mocks.showToast.mockClear();
  mocks.onSuccess = undefined;
  mocks.onError = undefined;
  usePlayerStore.setState({
    tracks: [],
    currentTrack: null,
    playbackMode: 'playlist',
    isPlaying: false,
  });
});

const savedTrack: SavedTrack = {
  id: 1,
  title: '회복된 트랙',
  artist: '아티스트',
  artworkUrl: null,
  permalinkUrl: 'https://soundcloud.com/example/track',
  durationMs: 180_000,
  genre: '',
  tags: [],
  savedAt: null,
};

function renderPage(onPlaySingleTrack = vi.fn()) {
  render(
    <MemoryRouter initialEntries={['/likes']}>
      <Routes>
        <Route element={<Outlet context={{ onPlaySingleTrack, onToggleTrack: vi.fn() }} />}>
          <Route path="/likes" element={<LikedTracksPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

}

it('clears a validation error when the same saved-tracks subscription later receives valid data', () => {
  renderPage();
  act(() => mocks.onError?.(new Error('invalid saved track')));
  expect(screen.getByRole('alert').textContent).toContain('저장한 트랙을 불러오지 못했습니다.');

  act(() => mocks.onSuccess?.([savedTrack]));

  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByText('회복된 트랙')).toBeTruthy();
});

it('shows the unsave button and a new-tab SoundCloud link on each saved track card', () => {
  renderLikesPage();

  act(() =>
    mocks.onSuccess?.([
      baseTrack,
      { ...baseTrack, id: 2, title: '링크 없는 트랙', permalinkUrl: null },
    ])
  );

  expect(screen.getByRole('button', { name: '회복된 트랙 저장 해제' })).toBeTruthy();

  const soundCloudLink = screen.getByRole('link', {
    name: '회복된 트랙 원곡을 SoundCloud에서 열기 (새 창)',
  });
  expect(soundCloudLink.getAttribute('href')).toBe('https://soundcloud.com/example/track');
  expect(soundCloudLink.getAttribute('target')).toBe('_blank');
  expect(soundCloudLink.getAttribute('rel')).toBe('noopener noreferrer');

  expect(screen.getByRole('button', { name: '링크 없는 트랙 저장 해제' })).toBeTruthy();
  expect(screen.getByText('원곡 링크 없음')).toBeTruthy();
});

it('shows a playback error toast when the selected bookmark fails', () => {
  const onPlaySingleTrack = vi.fn();
  renderPage(onPlaySingleTrack);
  act(() => mocks.onSuccess?.([savedTrack]));
  fireEvent.click(screen.getByRole('button', { name: savedTrack.title + ' 재생' }));
  expect(onPlaySingleTrack).toHaveBeenCalledWith(
    expect.objectContaining({ ...savedTrack, playbackStatus: 'unknown' }),
    expect.objectContaining({
      onFailure: expect.any(Function),
      onResolved: expect.any(Function),
    })
  );
  expect(mocks.showToast).not.toHaveBeenCalled();
  act(() => onPlaySingleTrack.mock.calls[0][1].onFailure());
  expect(mocks.showToast).toHaveBeenCalledWith({
    message: '곡 상태를 확인하지 못했습니다.',
    type: 'error',
  });
});

it('ignores legacy blocked metadata and checks again after reopening Likes', () => {
  const legacyTrack = {
    ...savedTrack,
    playbackStatus: 'blocked' as const,
    playbackStatusCheckedAt: Timestamp.now(),
  };
  usePlayerStore.setState({ tracks: [legacyTrack] });
  const onPlaySingleTrack = vi.fn();
  renderPage(onPlaySingleTrack);
  act(() => mocks.onSuccess?.([legacyTrack]));
  fireEvent.click(screen.getByRole('button', { name: savedTrack.title + ' 재생' }));
  expect(onPlaySingleTrack).toHaveBeenCalledWith(
    expect.objectContaining({ playbackStatus: 'unknown' }), expect.any(Object)
  );
  act(() => onPlaySingleTrack.mock.calls[0][1].onResolved(legacyTrack));
  expect(screen.getByText('재생 불가')).toBeTruthy();

  // A Firestore refresh must not replace the result confirmed on this page.
  const refreshedTrack = { ...legacyTrack, playbackStatus: 'allowed' as const };
  act(() => mocks.onSuccess?.([refreshedTrack]));
  expect(screen.getByText('재생 불가')).toBeTruthy();
  cleanup();
  const replay = vi.fn();
  renderPage(replay);
  act(() => mocks.onSuccess?.([legacyTrack]));
  fireEvent.click(screen.getByRole('button', { name: savedTrack.title + ' 재생' }));
  expect(replay).toHaveBeenCalledWith(
    expect.objectContaining({ playbackStatus: 'unknown' }), expect.any(Object)
  );
});

it('keeps a blocked lookup on the page, disables only that bookmark, and shows one warning', () => {
  const onPlaySingleTrack = vi.fn();
  const otherTrack: SavedTrack = {
    ...savedTrack,
    id: 2,
    title: '다른 트랙',
    permalinkUrl: 'https://soundcloud.com/example/other-track',
  };

  renderPage(onPlaySingleTrack);
  act(() => mocks.onSuccess?.([savedTrack, otherTrack]));
  fireEvent.click(
    screen.getByRole('button', { name: savedTrack.title + ' 재생' })
  );

  act(() =>
    onPlaySingleTrack.mock.calls[0][1].onResolved({
      ...savedTrack,
      playbackStatus: 'blocked',
    })
  );

  expect(screen.getByText('재생 불가')).toBeTruthy();
  expect(
    (screen.getByRole('button', {
      name: /회복된 트랙 재생, 재생 불가/,
    }) as HTMLButtonElement).disabled
  ).toBe(true);
  expect(
    (screen.getByRole('button', {
      name: otherTrack.title + ' 재생',
    }) as HTMLButtonElement).disabled
  ).toBe(false);
  expect(mocks.showToast).toHaveBeenCalledTimes(1);
  expect(mocks.showToast).toHaveBeenCalledWith({
    message: '재생할 수 없는 곡입니다.',
    type: 'warning',
  });
});

it('does not persist or block an unknown lookup result', () => {
  const onPlaySingleTrack = vi.fn();
  renderPage(onPlaySingleTrack);
  act(() => mocks.onSuccess?.([savedTrack]));
  fireEvent.click(
    screen.getByRole('button', { name: savedTrack.title + ' 재생' })
  );

  act(() =>
    onPlaySingleTrack.mock.calls[0][1].onResolved({
      ...savedTrack,
      playbackStatus: 'unknown',
    })
  );

  expect(screen.queryByText('재생 불가')).toBeNull();
  expect(
    (screen.getByRole('button', {
      name: savedTrack.title + ' 재생',
    }) as HTMLButtonElement).disabled
  ).toBe(false);
});

it('keeps retry available when the lookup fails', () => {
  const onPlaySingleTrack = vi.fn();
  renderPage(onPlaySingleTrack);
  act(() => mocks.onSuccess?.([savedTrack]));
  const button = screen.getByRole('button', { name: savedTrack.title + ' 재생' });
  fireEvent.click(button);
  act(() => onPlaySingleTrack.mock.calls[0][1].onFailure());
  fireEvent.click(button);
  expect(onPlaySingleTrack).toHaveBeenCalledTimes(2);
  expect(screen.queryByText('재생 불가')).toBeNull();
});
