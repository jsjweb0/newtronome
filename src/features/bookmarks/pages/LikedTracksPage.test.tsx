import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import LikedTracksPage from './LikedTracksPage';
import type { SavedTrack } from '../types/saved-track.types';
import { usePlayerStore } from '../../player/stores/usePlayerStore';

const mocks = vi.hoisted(() => ({
  showToast: vi.fn(),
  onSuccess: undefined as ((tracks: SavedTrack[]) => void) | undefined,
  onError: undefined as ((error: Error) => void) | undefined,
  updateSavedTrackPlaybackStatus: vi.fn(),
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
  updateSavedTrackPlaybackStatus: mocks.updateSavedTrackPlaybackStatus,
}));
beforeEach(() => {
  mocks.updateSavedTrackPlaybackStatus.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  mocks.showToast.mockClear();
  mocks.updateSavedTrackPlaybackStatus.mockReset();
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

it('persists a confirmed playlist status for the matching bookmark', async () => {
  usePlayerStore.setState({
    tracks: [{ ...savedTrack, playbackStatus: 'blocked' }],
  });

  renderPage();
  act(() => mocks.onSuccess?.([savedTrack]));

  await waitFor(() => {
    expect(mocks.updateSavedTrackPlaybackStatus).toHaveBeenCalledWith(
      'user-1',
      savedTrack.id,
      'blocked'
    );
  });
});

it('shows a fresh cached blocked status after entering the page', () => {
  renderPage();
  act(() =>
    mocks.onSuccess?.([
      {
        ...savedTrack,
        playbackStatus: 'blocked',
        playbackStatusCheckedAt: Timestamp.now(),
      },
    ])
  );

  expect(screen.getByText('재생 불가')).toBeTruthy();
  expect(
    (screen.getByRole('button', {
      name: /회복된 트랙 재생, 재생 불가/,
    }) as HTMLButtonElement).disabled
  ).toBe(true);
});

it('treats an expired blocked cache as unknown', () => {
  const onPlaySingleTrack = vi.fn();
  renderPage(onPlaySingleTrack);
  act(() =>
    mocks.onSuccess?.([
      {
        ...savedTrack,
        playbackStatus: 'blocked',
        playbackStatusCheckedAt: Timestamp.fromMillis(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ),
      },
    ])
  );

  const playButton = screen.getByRole('button', {
    name: savedTrack.title + ' 재생',
  });
  expect((playButton as HTMLButtonElement).disabled).toBe(false);

  fireEvent.click(playButton);
  expect(onPlaySingleTrack).toHaveBeenCalledWith(
    expect.objectContaining({ playbackStatus: 'unknown' }),
    expect.any(Object)
  );
});

it('prefers the current playlist status over the saved cache', () => {
  const onPlaySingleTrack = vi.fn();
  usePlayerStore.setState({
    tracks: [{ ...savedTrack, playbackStatus: 'allowed' }],
  });
  renderPage(onPlaySingleTrack);
  act(() =>
    mocks.onSuccess?.([
      {
        ...savedTrack,
        playbackStatus: 'blocked',
        playbackStatusCheckedAt: Timestamp.now(),
      },
    ])
  );

  fireEvent.click(
    screen.getByRole('button', { name: savedTrack.title + ' 재생' })
  );
  expect(onPlaySingleTrack).toHaveBeenCalledWith(
    expect.objectContaining({ playbackStatus: 'allowed' }),
    expect.any(Object)
  );
});

it('persists a blocked lookup, disables only that bookmark, and shows one warning', async () => {
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

  await waitFor(() => {
    expect(mocks.updateSavedTrackPlaybackStatus).toHaveBeenCalledWith(
      'user-1',
      savedTrack.id,
      'blocked'
    );
  });
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

  expect(mocks.updateSavedTrackPlaybackStatus).not.toHaveBeenCalled();
  expect(screen.queryByText('재생 불가')).toBeNull();
  expect(
    (screen.getByRole('button', {
      name: savedTrack.title + ' 재생',
    }) as HTMLButtonElement).disabled
  ).toBe(false);
});

it('does not overwrite an expired blocked cache when lookup fails', () => {
  const onPlaySingleTrack = vi.fn();
  renderPage(onPlaySingleTrack);
  act(() =>
    mocks.onSuccess?.([
      {
        ...savedTrack,
        playbackStatus: 'blocked',
        playbackStatusCheckedAt: Timestamp.fromMillis(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ),
      },
    ])
  );
  fireEvent.click(
    screen.getByRole('button', { name: savedTrack.title + ' 재생' })
  );

  act(() => onPlaySingleTrack.mock.calls[0][1].onFailure());

  expect(mocks.updateSavedTrackPlaybackStatus).not.toHaveBeenCalled();
});
