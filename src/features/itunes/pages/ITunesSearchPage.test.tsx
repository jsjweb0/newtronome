import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ITunesSearchPage from './ITunesSearchPage';
import { searchITunesTracks } from '../services/searchITunesTracks';
import { usePlayerStore } from '../../player/stores/usePlayerStore';
import type { ITunesTrack } from '../types/itunes.types';

const mocks = vi.hoisted(() => ({ onPauseSoundCloud: vi.fn() }));

vi.mock('react-router-dom', () => ({
  useOutletContext: () => ({ onPauseSoundCloud: mocks.onPauseSoundCloud }),
}));
vi.mock('../services/searchITunesTracks', () => ({ searchITunesTracks: vi.fn() }));
vi.mock('../../../components/track/TrackItem', () => ({
  default: ({ onTrackClick, ariaLabel, track }: {
    onTrackClick: () => void;
    ariaLabel: string;
    track: { title: string };
  }) => <button type="button" aria-label={ariaLabel} onClick={onTrackClick}>{track.title}</button>,
}));
vi.mock('../../../components/ui/Tooltip', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

const tracks: ITunesTrack[] = [
  { trackId: 1, trackName: '첫 곡', artistName: '가수', previewUrl: 'https://example.com/first.m4a' },
  { trackId: 2, trackName: '둘째 곡', artistName: '가수', previewUrl: 'https://example.com/second.m4a' },
];

function deferred() {
  let resolve!: () => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

async function showSearchResults() {
  render(<ITunesSearchPage />);
  fireEvent.change(screen.getByRole('searchbox', { name: '검색어' }), {
    target: { value: 'test' },
  });
  fireEvent.submit(screen.getByRole('searchbox', { name: '검색어' }).closest('form')!);
  expect(await screen.findByRole('button', { name: '첫 곡 30초 미리듣기' })).toBeTruthy();
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  usePlayerStore.setState({ tracks: [], isPlaying: false });
  vi.mocked(searchITunesTracks).mockResolvedValue(tracks);
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('iTunes preview request order', () => {
  it('keeps the latest track selected when an earlier play resolves later', async () => {
    const firstPlay = deferred();
    const secondPlay = deferred();
    vi.spyOn(HTMLMediaElement.prototype, 'play')
      .mockImplementationOnce(() => firstPlay.promise)
      .mockImplementationOnce(() => secondPlay.promise);
    await showSearchResults();

    fireEvent.click(screen.getByRole('button', { name: '첫 곡 30초 미리듣기' }));
    fireEvent.click(screen.getByRole('button', { name: '둘째 곡 30초 미리듣기' }));

    await act(async () => { secondPlay.resolve(); await secondPlay.promise; });
    expect(screen.getByRole('button', { name: '둘째 곡 미리듣기 정지' })).toBeTruthy();

    await act(async () => { firstPlay.resolve(); await firstPlay.promise; });
    expect(screen.getByRole('button', { name: '둘째 곡 미리듣기 정지' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '첫 곡 30초 미리듣기' })).toBeTruthy();
    expect(mocks.onPauseSoundCloud).toHaveBeenCalledTimes(2);
  });

  it('does not let an earlier play rejection clear a newer preview', async () => {
    const firstPlay = deferred();
    const secondPlay = deferred();
    vi.spyOn(HTMLMediaElement.prototype, 'play')
      .mockImplementationOnce(() => firstPlay.promise)
      .mockImplementationOnce(() => secondPlay.promise);
    await showSearchResults();

    fireEvent.click(screen.getByRole('button', { name: '첫 곡 30초 미리듣기' }));
    fireEvent.click(screen.getByRole('button', { name: '둘째 곡 30초 미리듣기' }));

    await act(async () => { secondPlay.resolve(); await secondPlay.promise; });
    await act(async () => { firstPlay.reject(new Error('interrupted')); try { await firstPlay.promise; } catch { /* expected */ } });

    expect(screen.getByRole('button', { name: '둘째 곡 미리듣기 정지' })).toBeTruthy();
  });

  it('ignores a pending play after SoundCloud starts', async () => {
    const pendingPlay = deferred();
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => pendingPlay.promise);
    await showSearchResults();

    fireEvent.click(screen.getByRole('button', { name: '첫 곡 30초 미리듣기' }));
    act(() => { usePlayerStore.setState({ isPlaying: true }); });
    await act(async () => { pendingPlay.resolve(); await pendingPlay.promise; });

    expect(screen.getByRole('button', { name: '첫 곡 30초 미리듣기' })).toBeTruthy();
    expect(mocks.onPauseSoundCloud).toHaveBeenCalledTimes(1);
  });
});
