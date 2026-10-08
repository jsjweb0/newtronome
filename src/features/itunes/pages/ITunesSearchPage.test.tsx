import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { getArtistTracks } from '../services/getArtistTracks';
import ITunesSearchPage from './ITunesSearchPage';
import { searchITunesTracks } from '../services/searchITunesTracks';
import { usePlayerStore } from '../../player/stores/usePlayerStore';
import type { ITunesTrack } from '../types/itunes.types';

const mocks = vi.hoisted(() => ({ onPauseSoundCloud: vi.fn() }));

vi.mock('react-router-dom', () => ({
  useOutletContext: () => ({ onPauseSoundCloud: mocks.onPauseSoundCloud }),
}));
vi.mock('../services/searchITunesTracks', () => ({ searchITunesTracks: vi.fn() }));
vi.mock('../services/getArtistTracks', () => ({ getArtistTracks: vi.fn() }));
vi.mock('../../../components/track/TrackItem', () => ({
  default: ({ onTrackClick, ariaLabel, track, footerActions }: {
    onTrackClick: () => void;
    ariaLabel: string;
    track: { title: string };
    footerActions?: ReactNode;
  }) => <><button type="button" aria-label={ariaLabel} onClick={onTrackClick}>{track.title}</button>{footerActions}</>,
}));
vi.mock('../../../components/ui/Tooltip', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

const tracks: ITunesTrack[] = [
  { artistId: 100, trackId: 1, trackName: '첫 곡', artistName: '가수', previewUrl: 'https://example.com/first.m4a' },
  { artistId: 100, trackId: 2, trackName: '둘째 곡', artistName: '가수', previewUrl: 'https://example.com/second.m4a' },
];

let queryClient: QueryClient;

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
  render(
    <QueryClientProvider client={queryClient}>
      <ITunesSearchPage />
    </QueryClientProvider>
  );
  fireEvent.change(screen.getByRole('searchbox', { name: '검색어' }), {
    target: { value: 'test' },
  });
  fireEvent.submit(screen.getByRole('searchbox', { name: '검색어' }).closest('form')!);
  expect(await screen.findByRole('button', { name: '첫 곡 30초 미리듣기' })).toBeTruthy();
}

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.clearAllMocks();
  vi.mocked(getArtistTracks).mockReset();
  localStorage.clear();
  usePlayerStore.setState({ tracks: [], isPlaying: false });
  vi.mocked(searchITunesTracks).mockResolvedValue(tracks);
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  queryClient.clear();
  vi.restoreAllMocks();
});

describe('artist panel cache', () => {
  it('reuses cached songs after closing and reopening the panel and after a new search', async () => {
    vi.mocked(getArtistTracks).mockResolvedValue([
      { ...tracks[0], trackId: 10, trackName: '아티스트 추가 곡' },
    ]);
    await showSearchResults();
    expect(getArtistTracks).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole('button', { name: '다른 곡 보기' })[0]);
    expect(await screen.findByRole('button', { name: '아티스트 추가 곡 미리듣기 재생' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '아티스트 곡 패널 닫기' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: '가수의 최신곡' })).toBeNull();
    });

    fireEvent.click(screen.getAllByRole('button', { name: '다른 곡 보기' })[1]);
    expect(await screen.findByRole('button', { name: '아티스트 추가 곡 미리듣기 재생' })).toBeTruthy();
    expect(getArtistTracks).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: '아티스트 곡 패널 닫기' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: '가수의 최신곡' })).toBeNull();
    });

    fireEvent.change(screen.getByRole('searchbox', { name: '검색어' }), {
      target: { value: '새 검색어' },
    });
    fireEvent.submit(screen.getByRole('searchbox', { name: '검색어' }).closest('form')!);
    await screen.findByRole('button', { name: '첫 곡 30초 미리듣기' });
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: '가수의 최신곡' })).toBeNull();
    });

    fireEvent.click(screen.getAllByRole('button', { name: '다른 곡 보기' })[0]);
    expect(await screen.findByRole('button', { name: '아티스트 추가 곡 미리듣기 재생' })).toBeTruthy();
    expect(getArtistTracks).toHaveBeenCalledTimes(1);
  });
});

describe('artist panel states and playback', () => {
  const extraTrack: ITunesTrack = {
    ...tracks[0], trackId: 10, trackName: '추가 곡',
    previewUrl: 'https://example.com/extra.m4a',
  };

  async function openPanel() {
    await showSearchResults();
    fireEvent.click(screen.getAllByRole('button', { name: '다른 곡 보기' })[0]);
    return within(await screen.findByRole('dialog', { name: '가수의 최신곡' }));
  }

  it('shows loading while the request is pending, then displays the songs', async () => {
    let resolve!: (tracks: ITunesTrack[]) => void;
    vi.mocked(getArtistTracks).mockReturnValue(new Promise((complete) => { resolve = complete; }));
    const panel = await openPanel();
    expect(panel.getByRole('status').textContent).toContain('불러오는 중');
    expect(panel.queryByText('표시할 곡이 없습니다.')).toBeNull();

    await act(async () => { resolve([extraTrack]); });
    expect(await panel.findByRole('button', { name: '추가 곡 미리듣기 재생' })).toBeTruthy();
    expect(panel.queryByRole('status')).toBeNull();
  });

  it('shows an error and recovers when the user retries', async () => {
    vi.mocked(getArtistTracks).mockRejectedValueOnce(new Error('Network failure'))
      .mockResolvedValueOnce([extraTrack]);
    const panel = await openPanel();
    expect((await panel.findByRole('alert')).textContent).toContain('불러오지 못했습니다');
    expect(panel.queryByText('표시할 곡이 없습니다.')).toBeNull();

    fireEvent.click(panel.getByRole('button', { name: '다시 시도' }));
    expect(await panel.findByRole('button', { name: '추가 곡 미리듣기 재생' })).toBeTruthy();
    expect(panel.queryByRole('alert')).toBeNull();
    expect(getArtistTracks).toHaveBeenCalledTimes(2);
  });

  it('shows the empty message after a successful empty response', async () => {
    vi.mocked(getArtistTracks).mockResolvedValue([]);
    const panel = await openPanel();
    expect(await panel.findByText('표시할 곡이 없습니다.')).toBeTruthy();
    expect(panel.queryByRole('status')).toBeNull();
    expect(panel.queryByRole('alert')).toBeNull();
  });

  it('pauses SoundCloud when an extra song plays and stops the preview when SoundCloud starts', async () => {
    vi.mocked(getArtistTracks).mockResolvedValue([extraTrack]);
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const panel = await openPanel();
    fireEvent.click(await panel.findByRole('button', { name: '추가 곡 미리듣기 재생' }));
    await panel.findByRole('button', { name: '추가 곡 미리듣기 정지' });
    expect(mocks.onPauseSoundCloud).toHaveBeenCalledTimes(1);
    const audio = document.querySelector('audio');
    expect(audio?.getAttribute('src')).toBe(extraTrack.previewUrl);
    const pauseCount = vi.mocked(HTMLMediaElement.prototype.pause).mock.calls.length;

    act(() => { usePlayerStore.setState({ isPlaying: true }); });
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledTimes(pauseCount + 1);
    expect(audio?.hasAttribute('src')).toBe(false);
    expect(panel.getByRole('button', { name: '추가 곡 미리듣기 재생' })).toBeTruthy();
  });

  it('aborts the pending artist A request when B is selected and ignores a late A response', async () => {
    vi.mocked(searchITunesTracks).mockResolvedValue([
      tracks[0], { ...tracks[1], artistId: 200, artistName: '다른 가수' },
    ]);
    let resolveA!: (tracks: ITunesTrack[]) => void;
    let signalA: AbortSignal | undefined;
    vi.mocked(getArtistTracks).mockImplementation(({ artistId, signal }) => {
      if (artistId === 100) {
        signalA = signal;
        return new Promise((complete) => { resolveA = complete; });
      }
      return Promise.resolve([{ ...extraTrack, artistId: 200, trackName: 'B의 곡' }]);
    });
    await openPanel();
    expect(signalA?.aborted).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: '아티스트 곡 패널 닫기' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: '가수의 최신곡' })).toBeNull();
    });
    fireEvent.click(screen.getAllByRole('button', { name: '다른 곡 보기' })[1]);
    await waitFor(() => expect(signalA?.aborted).toBe(true));
    const panel = within(await screen.findByRole('dialog', { name: '다른 가수의 최신곡' }));
    expect(await panel.findByRole('button', { name: 'B의 곡 미리듣기 재생' })).toBeTruthy();

    await act(async () => { resolveA([extraTrack]); });
    expect(panel.queryByRole('button', { name: '추가 곡 미리듣기 재생' })).toBeNull();
    expect(panel.getByRole('button', { name: 'B의 곡 미리듣기 재생' })).toBeTruthy();
  });
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

  it.each(['resolve', 'reject'] as const)('ignores a pending play %s after SoundCloud starts', async (outcome) => {
    const pendingPlay = deferred();
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => pendingPlay.promise);
    await showSearchResults();

    fireEvent.click(screen.getByRole('button', { name: '첫 곡 30초 미리듣기' }));
    const pausesBeforeSoundCloud = vi.mocked(HTMLMediaElement.prototype.pause).mock.calls.length;
    act(() => { usePlayerStore.setState({ isPlaying: true }); });
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledTimes(pausesBeforeSoundCloud + 1);
    await act(async () => {
      if (outcome === 'resolve') pendingPlay.resolve();
      else pendingPlay.reject(new Error('interrupted'));
      await pendingPlay.promise.catch(() => undefined);
    });
    expect(usePlayerStore.getState().isPlaying).toBe(true);

    expect(screen.getByRole('button', { name: '첫 곡 30초 미리듣기' })).toBeTruthy();
    expect(mocks.onPauseSoundCloud).toHaveBeenCalledTimes(1);
  });
});
