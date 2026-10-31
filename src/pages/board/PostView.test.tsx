import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Post } from '../../features/board/types/post';
import {
  fetchPostFromFirestore,
  fetchPostsFromFirestore,
  incrementPostViewCount,
} from '../../features/board/services/postsService';
import PostView from './PostView';
import { fetchComments } from '../../features/board/services/commentsService';
import { commentQueryKeys } from '../../features/board/queries/commentQueryKeys';
import type { Comment } from '../../features/board/types/comment';

vi.mock('../../features/board/services/postsService', () => ({
  fetchPostFromFirestore: vi.fn(),
  fetchPostsFromFirestore: vi.fn(),
  incrementPostViewCount: vi.fn(),
  deletePostFromFirestore: vi.fn(),
}));

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));
vi.mock('../../contexts/NotificationContext', () => ({
  useNotifications: () => ({ addNotification: vi.fn() }),
}));
vi.mock('../../components/auth/AuthAccess', () => ({
  AuthAccess: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('../../components/ui/LikeButton', () => ({ default: () => null }));
vi.mock('../../components/board/PostCommentSection', () => ({ default: () => null }));
vi.mock('../../components/board/ShareButton', () => ({ default: () => null }));
vi.mock('../../components/ui/Tooltip', () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));
vi.mock('../../features/board/services/commentsService', () => ({
  fetchComments: vi.fn(),
}));

const post: Post = {
  id: 'post-1',
  boardType: 'free',
  title: '본문을 표시해야 하는 글',
  content: '게시글 본문',
  authorUid: 'user-1',
  displayName: '작성자',
  photoURL: null,
  category: 'chat',
  date: new Date('2026-01-01'),
  updatedAt: null,
  likeCount: 0,
  likedUsers: [],
  viewCount: 3,
  isNotice: false,
};

function NavigationControl() {
  const navigate = useNavigate();
  return (
    <>
      <button onClick={() => navigate('/board/free/post-2')}>다른 글 열기</button>
      <button onClick={() => navigate('/board/free')}>목록 열기</button>
      <button onClick={() => navigate(-1)}>이전 화면</button>
    </>
  );
}

function renderPostView(
  getPost = vi.fn<typeof fetchPostFromFirestore>().mockResolvedValue(post),
) {
  vi.mocked(fetchPostFromFirestore).mockImplementation(getPost);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  const view = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/board/free/post-1']}>
        <NavigationControl />
        <Routes>
          <Route path="/board/free" element={<p>목록 화면</p>} />
          <Route path="/board/:boardType/:id" element={<PostView />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );

  return { getPost, queryClient, ...view };
}

beforeEach(() => {
  vi.mocked(fetchPostsFromFirestore).mockResolvedValue([post]);
  vi.mocked(fetchComments).mockResolvedValue([]);
  vi.mocked(incrementPostViewCount).mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  if (vi.isMockFunction(console.error)) {
    vi.mocked(console.error).mockRestore();
  }
});

describe('PostView request state', () => {
  it('renders the post even when recording the view count fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    vi.mocked(incrementPostViewCount)
      .mockRejectedValueOnce(new Error('permission denied'));

    renderPostView();

    expect(
      await screen.findByText('본문을 표시해야 하는 글'),
    ).toBeTruthy();

    expect(screen.getByText('게시글 본문')).toBeTruthy();
    expect(screen.getByText('조회수 3')).toBeTruthy();
  });

  it('ends loading on a failed read and recovers when retried', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const getPost = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(post);
    renderPostView(getPost);

    expect((await screen.findByRole('alert')).textContent).toContain('게시글을 불러오지 못했습니다.');
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByText('본문을 표시해야 하는 글')).toBeTruthy();
    expect(getPost).toHaveBeenCalledTimes(2);
    expect(getPost).toHaveBeenLastCalledWith('free', 'post-1');
    expect(fetchPostsFromFirestore).toHaveBeenCalledTimes(1);
    expect(fetchPostsFromFirestore).toHaveBeenCalledWith('free');
  });

  it('renders stored HTML as text while preserving legacy line breaks', async () => {
    const unsafePost = {
      ...post,
      content: '첫 줄<br><img src=x onerror=alert(1)><script>alert(1)</script>둘째 줄',
    };
    const { container } = renderPostView(
      vi.fn<typeof fetchPostFromFirestore>().mockResolvedValue(unsafePost),
    );

    expect(await screen.findByText('본문을 표시해야 하는 글')).toBeTruthy();
    expect(container.querySelector('pre')?.textContent).toBe(
      '첫 줄\n<img src=x onerror=alert(1)><script>alert(1)</script>둘째 줄'
    );
    expect(container.querySelector('pre img')).toBeNull();
    expect(container.querySelector('pre script')).toBeNull();
  });
});

describe('PostView independent requests', () => {
  it('renders the directly fetched post even if the navigation list fails', async () => {
    vi.mocked(fetchPostsFromFirestore).mockRejectedValueOnce(new Error('offline'));
    const { getPost } = renderPostView();
    expect(await screen.findByText('게시글 본문')).toBeTruthy();
    expect(getPost).toHaveBeenCalledWith('free', 'post-1');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it.each(['success', 'failure'] as const)(
    'ignores an old detail request that finishes with %s',
    async (outcome) => {
      let resolve!: (post: Post) => void;
      let reject!: (error: Error) => void;
      const oldRequest = new Promise<Post>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
      });
      const currentPost = { ...post, id: 'post-2', title: '현재 글', content: '현재 본문' };
      const getPost = vi.fn<typeof fetchPostFromFirestore>()
        .mockReturnValueOnce(oldRequest)
        .mockResolvedValueOnce(currentPost);
      renderPostView(getPost);
      fireEvent.click(screen.getByRole('button', { name: '다른 글 열기' }));
      await screen.findByText('현재 본문');

      await act(async () => {
        if (outcome === 'success') resolve(post);
        else reject(new Error('old request failed'));
      });

      expect(screen.getByText('현재 본문')).toBeTruthy();
      expect(screen.queryByText('게시글 본문')).toBeNull();
      expect(screen.queryByRole('alert')).toBeNull();
      expect(incrementPostViewCount).toHaveBeenCalledTimes(1);
      expect(incrementPostViewCount).toHaveBeenCalledWith('free', 'post-2');
    }
  );

  it('조회수 증가 성공 후 상세 캐시를 갱신한다', async () => {
    renderPostView();

    expect(await screen.findByText('조회수 4')).toBeTruthy();

    expect(incrementPostViewCount)
      .toHaveBeenCalledTimes(1);

    expect(incrementPostViewCount)
      .toHaveBeenCalledWith('free', 'post-1');
  });

  it('목록으로 나갔다가 같은 글에 다시 진입하면 조회수를 한 번 더 증가시킨다', async () => {
    renderPostView();

    await screen.findByText('조회수 4');
    expect(incrementPostViewCount).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: '목록 열기' }));
    expect(screen.queryByText('게시글 본문')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '이전 화면' }));

    await waitFor(() => {
      expect(incrementPostViewCount).toHaveBeenCalledTimes(2);
    });
  });

  it('댓글 목록 캐시가 바뀌면 상세 댓글 개수도 갱신한다', async () => {
    const comment: Comment = {
      id: 'comment-1', boardType: 'free', postId: post.id,
      content: '댓글', createdAt: new Date(), likeCount: 0, liked: false,
      writerUid: null, displayName: null, photoURL: null,
    };
    const { queryClient } = renderPostView();
    await screen.findByText('게시글 본문');
    const countElement = screen.getByRole('tooltip', { name: 'Comment', hidden: true }).parentElement;
    expect(countElement?.textContent).toContain('0');
    act(() => {
      queryClient.setQueryData(
        commentQueryKeys.postForViewer('free', post.id), [comment, { ...comment, id: 'comment-2' }],
      );
    });
    expect(await screen.findByText('2', { exact: true })).toBeTruthy();
    expect(fetchComments).toHaveBeenCalledWith('free', post.id, undefined);
  });

});
