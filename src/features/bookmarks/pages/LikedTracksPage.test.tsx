import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import LikedTracksPage from './LikedTracksPage';
import type { SavedTrack } from '../types/saved-track.types';

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
afterEach(() => {
  cleanup();
  mocks.showToast.mockClear();
  mocks.onSuccess = undefined;
  mocks.onError = undefined;
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
  expect(onPlaySingleTrack).toHaveBeenCalledWith(savedTrack, expect.any(Function));
  expect(mocks.showToast).not.toHaveBeenCalled();
  act(() => onPlaySingleTrack.mock.calls[0][1]());
  expect(mocks.showToast).toHaveBeenCalledWith({ message: '곡을 재생할 수 없습니다.', type: 'error' });
});
