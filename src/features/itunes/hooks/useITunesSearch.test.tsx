import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { searchITunesTracks } from '../services/searchITunesTracks';
import { useITunesSearch } from './useITunesSearch';

vi.mock('../services/searchITunesTracks', () => ({
  searchITunesTracks: vi.fn(),
}));

describe('useITunesSearch', () => {
  let queryClient: QueryClient;

  function wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    vi.clearAllMocks();
  });

  it('검색어가 없으면 요청하지 않는다', () => {
    renderHook(() => useITunesSearch(null), { wrapper });

    expect(searchITunesTracks).not.toHaveBeenCalled();
  });

  it('검색어와 AbortSignal을 전달한다', async () => {
    vi.mocked(searchITunesTracks).mockResolvedValue([]);

    const { result } = renderHook(
      () => useITunesSearch('아이유'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(searchITunesTracks).toHaveBeenCalledWith(
      '아이유',
      expect.any(AbortSignal)
    );
  });

  it('같은 검색어의 결과를 캐시한다', async () => {
    vi.mocked(searchITunesTracks).mockResolvedValue([]);

    const first = renderHook(
      () => useITunesSearch('아이유'),
      { wrapper }
    );

    await waitFor(() => {
      expect(first.result.current.isSuccess).toBe(true);
    });

    first.unmount();

    const second = renderHook(
      () => useITunesSearch('아이유'),
      { wrapper }
    );

    await waitFor(() => {
      expect(second.result.current.isSuccess).toBe(true);
    });

    expect(searchITunesTracks).toHaveBeenCalledTimes(1);
  });
});