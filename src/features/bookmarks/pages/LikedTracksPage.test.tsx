import { act, cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
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
  default: ({ track, actions }: { track: SavedTrack; actions?: ReactNode }) => (
    <div>
      <span>{track.title}</span>
      {actions}
    </div>
  ),
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
  mocks.onSuccess = undefined;
  mocks.onError = undefined;
});

it('clears a validation error when the same saved-tracks subscription later receives valid data', () => {
  render(
    <MemoryRouter initialEntries={['/likes']}>
      <Routes>
        <Route element={<Outlet context={{ onPlaySingleTrack: vi.fn(), onToggleTrack: vi.fn() }} />}>
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
