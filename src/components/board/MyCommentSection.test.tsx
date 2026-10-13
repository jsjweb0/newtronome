import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MyCommentSection from './MyCommentSection';
import { useMyCommentsQuery } from '../../features/board/hooks/useMyCommentsQuery';
import { deleteCommentFromFirestore, fetchMyComments } from '../../features/board/services/commentsService';
import type { Comment } from '../../features/board/types/comment';

const showToast = vi.hoisted(() => vi.fn());
vi.mock('../../contexts/ToastContext', () => ({ useToast: () => ({ showToast }) }));
vi.mock('../../features/board/services/commentsService', () => ({
  fetchMyComments: vi.fn(), deleteCommentFromFirestore: vi.fn(),
}));
const comment: Comment = {
  id: 'c1', boardType: 'free', postId: 'p1', content: '내가 작성한 댓글',
  createdAt: new Date('2026-01-01'), likeCount: 0, liked: false,
  writerUid: 'u1', writerEmail: null, displayName: null, photoURL: null,
};
let client: QueryClient;

function Harness() {
  const query = useMyCommentsQuery('u1');
  const [page, setPage] = useState(1);
  return <MyCommentSection
    comments={query.data ?? []} searchKeyword=""
    currentPage={page} setCurrentPage={setPage} handlePageChange={setPage}
    isPending={query.data === undefined && query.isPending}
    isError={query.data === undefined && query.isError}
    isFetching={query.isFetching} onRetry={() => { void query.refetch(); }}
  />;
}
function renderSection() {
  return render(<QueryClientProvider client={client}>
    <MemoryRouter><Harness /></MemoryRouter>
  </QueryClientProvider>);
}
beforeEach(() => {
  vi.resetAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.mocked(fetchMyComments).mockResolvedValue([comment]);
});
afterEach(() => { cleanup(); client.clear(); vi.restoreAllMocks(); });

describe('내 댓글 삭제 및 조회 상태', () => {
  it('삭제 확인을 취소하면 요청하지 않고 목록을 유지한다', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderSection();
    fireEvent.click(await screen.findByRole('button', { name: '삭제' }));
    expect(deleteCommentFromFirestore).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: comment.content })).toBeTruthy();
  });

  it('삭제 성공 후 다시 조회하여 빈 목록을 표시한다', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(fetchMyComments).mockResolvedValueOnce([comment]).mockResolvedValueOnce([]);
    vi.mocked(deleteCommentFromFirestore).mockResolvedValue(undefined);
    renderSection();
    fireEvent.click(await screen.findByRole('button', { name: '삭제' }));
    expect(await screen.findByText('작성한 댓글이 없습니다.')).toBeTruthy();
    expect(deleteCommentFromFirestore).toHaveBeenCalledWith('free', 'p1', 'c1');
    expect(fetchMyComments).toHaveBeenCalledTimes(2);
    expect(showToast).toHaveBeenCalledWith({ message: '댓글이 삭제되었습니다.' });
  });

  it('삭제 실패 시 댓글을 유지하고 실패 안내를 표시한다', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(deleteCommentFromFirestore).mockRejectedValue(new Error('offline'));
    renderSection();
    fireEvent.click(await screen.findByRole('button', { name: '삭제' }));
    await waitFor(() => expect(showToast).toHaveBeenCalledWith({ message: '삭제에 실패했습니다.', type: 'error' }));
    expect(screen.getByRole('link', { name: comment.content })).toBeTruthy();
    expect(fetchMyComments).toHaveBeenCalledTimes(1);
  });

  it('조회 실패 후 재시도하면 댓글 목록을 복구한다', async () => {
    vi.mocked(fetchMyComments).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([comment]);
    renderSection();
    expect((await screen.findByRole('alert')).textContent).toContain('내 댓글을 불러오지 못했습니다.');
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(await screen.findByRole('link', { name: comment.content })).toBeTruthy();
  });
});
