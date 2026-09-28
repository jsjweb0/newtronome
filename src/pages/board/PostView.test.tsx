import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PostsContext, type Post, type PostsContextValue } from '../../contexts/PostsContext';
import PostView from './PostView';

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

function renderPostView(overrides: Partial<PostsContextValue> = {}) {
  const context: PostsContextValue = {
    getPosts: vi.fn().mockResolvedValue([post]),
    getPost: vi.fn(),
    getMyPosts: vi.fn(),
    createPost: vi.fn(),
    updatePost: vi.fn(),
    updateViewCount: vi.fn().mockResolvedValue(undefined),
    deletePost: vi.fn(),
    ...overrides,
  };

  const view = render(
    <PostsContext.Provider value={context}>
      <MemoryRouter initialEntries={['/board/free/post-1']}>
        <Routes>
          <Route path="/board/:boardType/:id" element={<PostView />} />
        </Routes>
      </MemoryRouter>
    </PostsContext.Provider>
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
    const getPosts = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([post]);
    renderPostView({ getPosts });

    expect((await screen.findByRole('alert')).textContent).toContain('게시글을 불러오지 못했습니다.');
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByText('본문을 표시해야 하는 글')).toBeTruthy();
    expect(getPosts).toHaveBeenCalledTimes(2);
  });

  it('renders stored HTML as text while preserving legacy line breaks', async () => {
    const unsafePost = {
      ...post,
      content: '첫 줄<br><img src=x onerror=alert(1)><script>alert(1)</script>둘째 줄',
    };
    const { container } = renderPostView({
      getPosts: vi.fn().mockResolvedValue([unsafePost]),
    });

    expect(await screen.findByText('본문을 표시해야 하는 글')).toBeTruthy();
    expect(container.querySelector('pre')?.textContent).toBe(
      '첫 줄\n<img src=x onerror=alert(1)><script>alert(1)</script>둘째 줄'
    );
    expect(container.querySelector('pre img')).toBeNull();
    expect(container.querySelector('pre script')).toBeNull();
  });
});
