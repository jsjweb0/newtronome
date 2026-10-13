import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Post } from '../../features/board/types/post';
import {
  fetchPostsFromFirestore,
  fetchPostFromFirestore,
  updatePostInFirestore,
} from '../../features/board/services/postsService';
import BoardPage from './BoardPage';
import PostView from './PostView';
import EditPostPage from './EditPostPage';
import { fetchCommentCount } from '../../features/board/services/commentsService';

vi.mock('../../features/board/services/postsService', () => ({
  fetchPostsFromFirestore: vi.fn(),
  fetchPostFromFirestore: vi.fn(),
  incrementPostViewCount: vi.fn().mockResolvedValue(undefined),
  updatePostInFirestore: vi.fn(),
  deletePostFromFirestore: vi.fn(),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'user-1', email: 'user@example.com', displayName: '작성자', isAdmin: true },
    loading: false,
  }),
}));
vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));
vi.mock('../../contexts/NotificationContext', () => ({
  useNotifications: () => ({ addNotification: vi.fn() }),
}));
vi.mock('../../features/board/services/commentsService', () => ({
  fetchCommentCount: vi.fn().mockResolvedValue(0),
  fetchComments: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../components/ui/LikeButton', () => ({ default: () => null }));
vi.mock('../../components/board/PostCommentSection', () => ({ default: () => null }));
vi.mock('../../components/board/ShareButton', () => ({ default: () => null }));
vi.mock('../../components/ui/Tooltip', () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));

const keyword = '질문 & 답변';
const conditions = { page: '2', keyword, category: 'question', sort: 'asc' };
const search = `?${new URLSearchParams(conditions).toString()}`;
const posts: Post[] = Array.from({ length: 12 }, (_, index) => ({
  id: `post-${index + 1}`,
  boardType: 'free',
  title: `${keyword} ${index + 1}`,
  content: `본문 ${index + 1}`,
  authorUid: 'user-1',
  email: 'user@example.com',
  displayName: '작성자',
  photoURL: null,
  category: 'question',
  postNo: index + 1,
  date: null,
  updatedAt: null,
  likeCount: 0,
  likedUsers: [],
  viewCount: 0,
  isNotice: false,
}));

function LocationDisplay() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}</output>;
}

function currentUrl() {
  return screen.getByTestId('location').textContent ?? '';
}

function expectConditions(url: string, pathname: string, expected: Record<string, string> = conditions) {
  const parsed = new URL(url, 'https://example.test');
  expect(parsed.pathname).toBe(pathname);
  expect(Object.fromEntries(parsed.searchParams)).toEqual(expected);
}

type RenderBoardRouteOptions = {
  getPosts?: typeof fetchPostsFromFirestore;
  getPost?: typeof fetchPostFromFirestore;
  updatePost?: typeof updatePostInFirestore;
};

function renderBoardRoute(url: string, options: RenderBoardRouteOptions = {}) {
  const getPosts = options.getPosts ?? vi.fn<typeof fetchPostsFromFirestore>()
    .mockResolvedValue(posts);
  const getPost = options.getPost ?? vi.fn<typeof fetchPostFromFirestore>()
    .mockImplementation(async (_board, id) => {
      const post = posts.find((item) => item.id === id);
      if (!post) throw new Error('Post not found');
      return post;
    });
  const updatePost = options.updatePost ?? vi.fn<typeof updatePostInFirestore>()
    .mockResolvedValue(undefined);

  vi.mocked(fetchPostsFromFirestore).mockImplementation(getPosts);
  vi.mocked(fetchPostFromFirestore).mockImplementation(getPost);
  vi.mocked(fetchCommentCount).mockResolvedValue(0);
  vi.mocked(updatePostInFirestore).mockImplementation(updatePost);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[url]}>
        <LocationDisplay />
        <Routes>
          <Route path="/board/:boardType" element={<BoardPage />} />
          <Route path="/board/:boardType/:id" element={<PostView />} />
          <Route path="/board/:boardType/edit/:id" element={<EditPostPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return { getPosts, getPost, updatePost };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  if (vi.isMockFunction(console.error)) {
    vi.mocked(console.error).mockRestore();
  }
});

describe('Board list conditions across routes', () => {
  it('preserves all four conditions from the filtered list to detail and back', async () => {
    renderBoardRoute(`/board/free${search}`);
    const link = await screen.findByRole('link', { name: (_name, element) => element.textContent === `[질문]${keyword} 11` });
    expectConditions(link.getAttribute('href') ?? '', '/board/free/post-11');
    fireEvent.click(link);
    await screen.findByText('본문 11');
    expectConditions(currentUrl(), '/board/free/post-11');
    fireEvent.click(screen.getByRole('button', { name: '목록' }));
    await screen.findByRole('textbox', { name: '검색어' });
    expectConditions(currentUrl(), '/board/free');
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: '검색어' }).value).toBe(keyword);
    expect(screen.getByRole('button', { name: '질문' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('link', { name: (_name, element) => element.textContent === `[질문]${keyword} 11` })).toBeTruthy();
    expect(screen.queryByRole('link', { name: (_name, element) => element.textContent === `[질문]${keyword} 1` })).toBeNull();
  });

  it.each([
    ['이전글', 'post-10', '본문 10'],
    ['다음글', 'post-12', '본문 12'],
  ])('preserves all conditions in the %s link and after navigation', async (name, id, content) => {
    renderBoardRoute(`/board/free/post-11${search}`);
    const link = await screen.findByRole('link', { name: new RegExp(name) });
    expectConditions(link.getAttribute('href') ?? '', `/board/free/${id}`);
    fireEvent.click(link);
    await screen.findByText(content);
    expectConditions(currentUrl(), `/board/free/${id}`);
  });

  it.each(['list', 'detail'] as const)(
    'preserves conditions when entering edit from %s and returning after save',
    async (source) => {
      const { updatePost } = renderBoardRoute(
        `/board/free${source === 'detail' ? '/post-11' : ''}${search}`,
      );
      const links = await screen.findAllByRole('link', { name: '수정' });
      expectConditions(links[0].getAttribute('href') ?? '', '/board/free/edit/post-11');
      fireEvent.click(links[0]);
      const title = await screen.findByPlaceholderText<HTMLInputElement>('제목을 입력해주세요');
      expectConditions(currentUrl(), '/board/free/edit/post-11');
      fireEvent.change(title, { target: { value: `${keyword} 수정` } });
      fireEvent.click(screen.getByRole('button', { name: '수정' }));
      await screen.findByRole('textbox', { name: '검색어' });
      expectConditions(currentUrl(), '/board/free');
      expect(updatePost).toHaveBeenCalledWith('free', 'post-11', expect.objectContaining({
        title: `${keyword} 수정`, content: '본문 11', category: 'question',
      }));
    }
  );

  it('keeps edited inputs and URL conditions when saving fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const updatePost = vi.fn<typeof updatePostInFirestore>()
      .mockRejectedValue(new Error('permission denied'));
    renderBoardRoute(`/board/free/edit/post-11${search}`, {
      updatePost,
    });
    const title = await screen.findByPlaceholderText<HTMLInputElement>('제목을 입력해주세요');
    const content = screen.getByPlaceholderText<HTMLTextAreaElement>('내용을 입력해주세요.');
    fireEvent.change(title, { target: { value: '수정한 제목' } });
    fireEvent.change(content, { target: { value: '수정한 본문' } });
    fireEvent.change(screen.getByTitle('카테고리'), { target: { value: 'chat' } });
    fireEvent.click(screen.getByRole('button', { name: '수정' }));
    await waitFor(() => expect(screen.getByRole<HTMLButtonElement>('button', { name: '수정' }).disabled).toBe(false));
    expect(updatePost).toHaveBeenCalledTimes(1);
    expect(title.value).toBe('수정한 제목');
    expect(content.value).toBe('수정한 본문');
    expect(screen.getByTitle<HTMLSelectElement>('카테고리').value).toBe('chat');
    expectConditions(currentUrl(), '/board/free/edit/post-11');
  });

  it('omits the category parameter through detail, edit and save when none was selected', async () => {
    const expected = { page: '2', keyword, sort: 'asc' };
    renderBoardRoute(`/board/free?${new URLSearchParams(expected)}`);
    const link = await screen.findByRole('link', { name: (_name, element) => element.textContent === `[질문]${keyword} 11` });
    expectConditions(link.getAttribute('href') ?? '', '/board/free/post-11', expected);
    fireEvent.click(link);
    await screen.findByText('본문 11');
    fireEvent.click(screen.getByRole('link', { name: '수정' }));
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText<HTMLInputElement>('제목을 입력해주세요').value
      ).toBe(`${keyword} 11`);
      expect(
        screen.getByPlaceholderText<HTMLTextAreaElement>('내용을 입력해주세요.').value
      ).toBe('본문 11');
      expect(screen.getByTitle<HTMLSelectElement>('카테고리').value).toBe('question');
    });
    expectConditions(currentUrl(), '/board/free/edit/post-11', expected);
    fireEvent.click(screen.getByRole('button', { name: '수정' }));
    await screen.findByRole('textbox', { name: '검색어' });
    expectConditions(currentUrl(), '/board/free', expected);
  });
});
