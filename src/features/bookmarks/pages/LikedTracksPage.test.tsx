import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import LikedTracksPage from './LikedTracksPage';
import type { SavedTrack } from '../types/saved-track.types';

const mocks = vi.hoisted(() => ({
  onSuccess: undefined as ((tracks: SavedTrack[]) => void) | undefined,
  onError: undefined as ((error: Error) => void) | undefined,
}));

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'user-1' }, loading: false }),
}));
vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));
vi.mock('../services/savedTracks', () => ({
  subscribeToSavedTracks: vi.fn((_uid, onSuccess, onError) => {
    mocks.onSuccess = onSuccess;
    mocks.onError = onError;
    return vi.fn();
  }),
  removeSavedTrack: vi.fn(),
}));
vi.mock('../../../components/track/TrackItem', () => ({
  default: ({ track }: { track: SavedTrack }) => <span>{track.title}</span>,
}));

afterEach(() => {
  cleanup();
  mocks.onSuccess = undefined;
  mocks.onError = undefined;
});

it('clears a validation error when the same saved-tracks subscription later receives valid data', () => {
  render(
    <MemoryRouter initialEntries={['/likes']}>
      <Routes>
        <Route element={<Outlet context={{ onPlayBookmarkTrack: vi.fn(), onToggleTrack: vi.fn() }} />}>
          <Route path="/likes" element={<LikedTracksPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

  act(() => mocks.onError?.(new Error('invalid saved track')));
  expect(screen.getByRole('alert').textContent).toContain('저장한 트랙을 불러오지 못했습니다.');

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
  act(() => mocks.onSuccess?.([savedTrack]));

  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByText('회복된 트랙')).toBeTruthy();
});
