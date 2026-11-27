import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Post } from '../../features/board/types/post';
import {
  fetchPostsFromFirestore,
  fetchPostFromFirestore,
  updatePostInFirestore,
} from '../../features/board/services/postsService';
import BoardPage from './BoardPage';
import PostWritePage from './PostWritePage';
import type { AuthUser } from '../../contexts/AuthContext';
import PostView from './PostView';
import EditPostPage from './EditPostPage';
import { fetchCommentCount } from '../../features/board/services/commentsService';

vi.mock('../../features/board/services/postsService', () => ({
  createPostInFirestore: vi.fn(),
  fetchPostsFromFirestore: vi.fn(),
  fetchPostFromFirestore: vi.fn(),
  incrementPostViewCount: vi.fn().mockResolvedValue(undefined),
  updatePostInFirestore: vi.fn(),
  deletePostFromFirestore: vi.fn(),
}));

const authState = vi.hoisted(() => ({ user: null as AuthUser | null, loading: false }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => authState }));
beforeEach(() => {
  authState.user = { uid: 'user-1', email: 'user@example.com', displayName: '작성자', isAdmin: true, photoURL: null };
  authState.loading = false;
});
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
  displayName: '작성자',
  photoURL: null,
  category: 'question',
  date: new Date(Date.UTC(2026, 0, index + 1)),
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
  const route = () => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[url]}>
        <LocationDisplay />
        <Routes>
          <Route path="/login" element={<p>로그인 화면</p>} />
          <Route path="/board/:boardType/write" element={<PostWritePage />} />
          <Route path="/board/:boardType" element={<BoardPage />} />
          <Route path="/board/:boardType/:id" element={<PostView />} />
          <Route path="/board/:boardType/edit/:id" element={<EditPostPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
  const view = render(route());
  return { getPosts, getPost, updatePost, refresh: () => view.rerender(route()) };
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
    const link = await screen.findByRole('link', { name: (_name, element) => element.textContent === `질문${keyword} 11` });
    expectConditions(link.getAttribute('href') ?? '', '/board/free/post-11');
    fireEvent.click(link);
    await screen.findByText('본문 11');
    expectConditions(currentUrl(), '/board/free/post-11');
    fireEvent.click(screen.getByRole('button', { name: '목록' }));
    await screen.findByRole('textbox', { name: '검색어' });
    expectConditions(currentUrl(), '/board/free');
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: '검색어' }).value).toBe(keyword);
    expect(screen.getByRole('button', { name: '질문' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('link', { name: (_name, element) => element.textContent === `질문${keyword} 11` })).toBeTruthy();
    expect(screen.queryByRole('link', { name: (_name, element) => element.textContent === `질문${keyword} 1` })).toBeNull();
  });

  it.each([
    ['이전글', 'post-10', '본문 10', '1'],
    ['다음글', 'post-12', '본문 12', '2'],
  ])('preserves the list conditions and target page in the %s link', async (name, id, content, targetPage) => {
    renderBoardRoute(`/board/free/post-11${search}`);
    const link = await screen.findByRole('link', { name: new RegExp(name) });
    expectConditions(link.getAttribute('href') ?? '', `/board/free/${id}`, {
      ...conditions,
      page: targetPage,
    });
    fireEvent.click(link);
    await screen.findByText(content);
    expectConditions(currentUrl(), `/board/free/${id}`, {
      ...conditions,
      page: targetPage,
    });
  });

  it('uses only posts matching the keyword and category for previous and next navigation', async () => {
    const navigationPosts: Post[] = [
      { ...posts[0], id: 'matching-1', title: '리액트 질문 1' },
      { ...posts[1], id: 'other-keyword', title: '자바스크립트 질문' },
      { ...posts[2], id: 'matching-3', title: '리액트 질문 3' },
      { ...posts[3], id: 'other-category', title: '리액트 질문 4', category: 'chat' },
      { ...posts[4], id: 'matching-5', title: '리액트 질문 5' },
    ];
    const filteredSearch = `?${new URLSearchParams({
      page: '1',
      keyword: '리액트',
      category: 'question',
      sort: 'asc',
    })}`;

    renderBoardRoute(`/board/free/matching-3${filteredSearch}`, {
      getPosts: vi.fn<typeof fetchPostsFromFirestore>().mockResolvedValue(navigationPosts),
      getPost: vi.fn<typeof fetchPostFromFirestore>().mockResolvedValue(navigationPosts[2]),
    });

    expect(
      (await screen.findByRole('link', { name: /이전글/ })).getAttribute('href'),
    ).toContain('/board/free/matching-1');
    expect(screen.getByRole('link', { name: /다음글/ }).getAttribute('href')).toContain(
      '/board/free/matching-5',
    );
    expect(screen.queryByText('자바스크립트 질문')).toBeNull();
    expect(screen.queryByText('리액트 질문 4')).toBeNull();
  });

  it('changes previous and next navigation order when descending sort is selected', async () => {
    const descendingSearch = `?${new URLSearchParams({
      page: '1',
      keyword,
      category: 'question',
      sort: 'desc',
    })}`;

    renderBoardRoute(`/board/free/post-6${descendingSearch}`);

    expect(
      (await screen.findByRole('link', { name: /이전글/ })).getAttribute('href'),
    ).toContain('/board/free/post-7');
    expect(screen.getByRole('link', { name: /다음글/ }).getAttribute('href')).toContain(
      '/board/free/post-5',
    );
  });

  it('does not show navigation links when the current post is outside the filtered result', async () => {
    const unmatchedSearch = `?${new URLSearchParams({
      page: '1',
      keyword: '검색 결과에 없는 제목',
      category: 'question',
      sort: 'asc',
    })}`;

    renderBoardRoute(`/board/free/post-6${unmatchedSearch}`);

    await screen.findByText('본문 6');
    expect(screen.queryByRole('link', { name: /이전글/ })).toBeNull();
    expect(screen.queryByRole('link', { name: /다음글/ })).toBeNull();
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
    fireEvent.click(screen.getByRole('radio', { name: '수다' }));
    fireEvent.click(screen.getByRole('button', { name: '수정' }));
    await waitFor(() => expect(screen.getByRole<HTMLButtonElement>('button', { name: '수정' }).disabled).toBe(false));
    expect(updatePost).toHaveBeenCalledTimes(1);
    expect(title.value).toBe('수정한 제목');
    expect(content.value).toBe('수정한 본문');
    expect(screen.getByRole('radio', { name: '수다' }).getAttribute('aria-checked')).toBe('true');
    expectConditions(currentUrl(), '/board/free/edit/post-11');
  });

  it('omits the category parameter through detail, edit and save when none was selected', async () => {
    const expected = { page: '2', keyword, sort: 'asc' };
    renderBoardRoute(`/board/free?${new URLSearchParams(expected)}`);
    const link = await screen.findByRole('link', { name: (_name, element) => element.textContent === `질문${keyword} 11` });
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
      expect(screen.getByRole('radio', { name: '질문' }).getAttribute('aria-checked')).toBe('true');
    });
    expectConditions(currentUrl(), '/board/free/edit/post-11', expected);
    fireEvent.click(screen.getByRole('button', { name: '수정' }));
    await screen.findByRole('textbox', { name: '검색어' });
    expectConditions(currentUrl(), '/board/free', expected);
  });
});


describe('게시판 인증 복원 대기', () => {
  it.each(['/board/free/write', '/board/free/edit/post-11'])(
    '%s에서 인증 복원 전에는 이동하지 않고 복원 후 폼을 표시한다', async (url) => {
      authState.user = null;
      authState.loading = true;
      const { refresh, getPost } = renderBoardRoute(url);
      if (url.includes('/edit/')) await waitFor(() => expect(getPost).toHaveBeenCalled());
      expect(screen.getByText('로그인 상태를 확인하는 중입니다.').getAttribute('role')).toBe('status');
      expect(currentUrl()).toBe(url);
      authState.user = { uid: 'user-1', email: null, displayName: '작성자', photoURL: null, isAdmin: false };
      authState.loading = false;
      refresh();
      await screen.findByPlaceholderText('제목을 입력해주세요');
      expect(currentUrl()).toBe(url);
    },
  );

  it.each([
    ['/board/free/write', '/login'],
    ['/board/free/edit/post-11', '/board/free'],
  ])('%s에서 비로그인이 확정되면 %s로 이동한다', async (url, target) => {
    authState.user = null;
    authState.loading = true;
    const { refresh } = renderBoardRoute(url);
    expect(currentUrl()).toBe(url);
    authState.loading = false;
    refresh();
    await waitFor(() => expect(currentUrl()).toBe(target));
  });
});
