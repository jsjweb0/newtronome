import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PostsContext, type Post, type PostsContextValue } from '../../contexts/PostsContext';
import { fetchPostFromFirestore } from '../../features/board/services/postsService';
import PostView from './PostView';

vi.mock('../../features/board/services/postsService', () => ({
  fetchPostFromFirestore: vi.fn(),
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
vi.mock('../../utils/comment', () => ({
  getCommentCountFromDB: vi.fn().mockResolvedValue(0),
}));

const post: Post = {
  id: 'post-1',
  boardType: 'free',
  title: '본문을 표시해야 하는 글',
  content: '게시글 본문',
  authorUid: 'user-1',
  email: 'user@example.com',
  displayName: '작성자',
  photoURL: null,
  category: 'chat',
  postNo: 1,
  date: new Date('2026-01-01'),
  updatedAt: null,
  likeCount: 0,
  likedUsers: [],
  viewCount: 3,
  isNotice: false,
};

function NavigationControl() {
  const navigate = useNavigate();
  return <button onClick={() => navigate('/board/free/post-2')}>다른 글 열기</button>;
}

function renderPostView(overrides: Partial<PostsContextValue> = {}) {
  const context: PostsContextValue = {
    getPosts: vi.fn().mockResolvedValue([post]),
    getPost: vi.fn().mockResolvedValue(post),
    getMyPosts: vi.fn(),
    createPost: vi.fn(),
    updatePost: vi.fn(),
    updateViewCount: vi.fn().mockResolvedValue(undefined),
    deletePost: vi.fn(),
    ...overrides,
  };
  vi.mocked(fetchPostFromFirestore).mockImplementation(context.getPost);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  const view = render(
    <QueryClientProvider client={queryClient}>
      <PostsContext.Provider value={context}>
        <MemoryRouter initialEntries={['/board/free/post-1']}>
          <NavigationControl />
          <Routes>
            <Route path="/board/:boardType/:id" element={<PostView />} />
          </Routes>
        </MemoryRouter>
      </PostsContext.Provider>
    </QueryClientProvider>
  );

  return { context, ...view };
}

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
    renderPostView({
      updateViewCount: vi.fn().mockRejectedValue(new Error('permission denied')),
    });

    expect(await screen.findByText('본문을 표시해야 하는 글')).toBeTruthy();
    expect(screen.getByText('게시글 본문')).toBeTruthy();
    expect(screen.getByText('조회수 3')).toBeTruthy();
  });

  it('ends loading on a failed read and recovers when retried', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const getPost = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(post);
    const { context } = renderPostView({ getPost });

    expect((await screen.findByRole('alert')).textContent).toContain('게시글을 불러오지 못했습니다.');
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByText('본문을 표시해야 하는 글')).toBeTruthy();
    expect(getPost).toHaveBeenCalledTimes(2);
    expect(getPost).toHaveBeenLastCalledWith('free', 'post-1');
    expect(context.getPosts).toHaveBeenCalledTimes(1);
  });

  it('renders stored HTML as text while preserving legacy line breaks', async () => {
    const unsafePost = {
      ...post,
      content: '첫 줄<br><img src=x onerror=alert(1)><script>alert(1)</script>둘째 줄',
    };
    const { container } = renderPostView({
      getPost: vi.fn().mockResolvedValue(unsafePost),
    });

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
    const { context } = renderPostView({
      getPosts: vi.fn().mockRejectedValue(new Error('offline')),
    });
    expect(await screen.findByText('게시글 본문')).toBeTruthy();
    expect(context.getPost).toHaveBeenCalledWith('free', 'post-1');
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
      const getPost = vi.fn<PostsContextValue['getPost']>()
        .mockReturnValueOnce(oldRequest)
        .mockResolvedValueOnce(currentPost);
      const { context } = renderPostView({ getPost });
      fireEvent.click(screen.getByRole('button', { name: '다른 글 열기' }));
      await screen.findByText('현재 본문');

      await act(async () => {
        if (outcome === 'success') resolve(post);
        else reject(new Error('old request failed'));
      });

      expect(screen.getByText('현재 본문')).toBeTruthy();
      expect(screen.queryByText('게시글 본문')).toBeNull();
      expect(screen.queryByRole('alert')).toBeNull();
      expect(context.updateViewCount).toHaveBeenCalledTimes(1);
      expect(context.updateViewCount).toHaveBeenCalledWith('free', 'post-2');
    }
  );
});
