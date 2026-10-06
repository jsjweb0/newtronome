import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useArtistTracks } from './useArtistTracks';
import { getArtistTracks } from '../services/getArtistTracks';

vi.mock('../services/getArtistTracks', () => ({ getArtistTracks: vi.fn() }));

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.mocked(getArtistTracks).mockReset();
  vi.mocked(getArtistTracks).mockImplementation(async ({ artistId }) => [{
    artistId, trackId: artistId, trackName: `Song ${artistId}`, artistName: `Artist ${artistId}`,
  }]);
});

afterEach(() => {
  cleanup();
  queryClient.clear();
  vi.restoreAllMocks();
});

describe('useArtistTracks cache', () => {
  it('waits for selection and keeps separate caches when switching artists', async () => {
    const { result, rerender } = renderHook(
      ({ id }: { id: number | null }) => useArtistTracks(id),
      { initialProps: { id: null } as { id: number | null }, wrapper },
    );
    expect(getArtistTracks).not.toHaveBeenCalled();

    rerender({ id: 100 });
    await waitFor(() => expect(result.current.data?.[0].artistId).toBe(100));
    rerender({ id: 200 });
    await waitFor(() => expect(result.current.data?.[0].artistId).toBe(200));
    rerender({ id: 100 });
    await waitFor(() => expect(result.current.data?.[0].artistId).toBe(100));
    expect(getArtistTracks).toHaveBeenCalledTimes(2);
  });

  it('reuses fresh data on remount and fetches again after five minutes', async () => {
    const start = Date.now();
    const now = vi.spyOn(Date, 'now').mockReturnValue(start);
    const first = renderHook(() => useArtistTracks(100), { wrapper });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    first.unmount();

    now.mockReturnValue(start + 4 * 60 * 1000);
    const fresh = renderHook(() => useArtistTracks(100), { wrapper });
    expect(fresh.result.current.data?.[0].trackName).toBe('Song 100');
    expect(getArtistTracks).toHaveBeenCalledTimes(1);
    fresh.unmount();

    now.mockReturnValue(start + 5 * 60 * 1000 + 1);
    vi.mocked(getArtistTracks).mockResolvedValue([
      { artistId: 100, trackId: 101, trackName: 'Updated song', artistName: 'Artist 100' },
    ]);
    const stale = renderHook(() => useArtistTracks(100), { wrapper });
    expect(stale.result.current.data?.[0].trackName).toBe('Song 100');
    await waitFor(() => expect(stale.result.current.data?.[0].trackName).toBe('Updated song'));
    expect(getArtistTracks).toHaveBeenCalledTimes(2);
  });
});
