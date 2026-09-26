import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PostsContext, type Post, type PostsContextValue } from '../../contexts/PostsContext';
import BoardPage from './BoardPage';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('../../contexts/NotificationContext', () => ({
  useNotifications: () => ({ addNotification: vi.fn() }),
}));

vi.mock('../../utils/comment', () => ({
  getCommentCountFromDB: vi.fn().mockResolvedValue(0),
}));

const posts: Post[] = Array.from({ length: 12 }, (_, index) => {
  const postNo = index + 1;
  return {
    id: `post-${postNo}`,
    boardType: 'free',
    title: `${postNo >= 11 ? '질문' : '일반 글'} ${postNo}`,
    content: '테스트 게시글',
    authorUid: null,
    email: null,
    displayName: '작성자',
    photoURL: null,
    category: postNo === 12 ? 'question' : 'chat',
    postNo,
    date: null,
    updatedAt: null,
    likeCount: 0,
    likedUsers: [],
    viewCount: 0,
    isNotice: false,
  };
});

function HistoryControls() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <span data-testid="location">{location.search}</span>
      <button onClick={() => navigate(-1)}>이전 기록</button>
      <button onClick={() => navigate(1)}>다음 기록</button>
      <button onClick={() => navigate('/board/notice')}>공지사항으로 이동</button>
    </>
  );
}

function currentSearch() {
  return screen.getByTestId('location').textContent ?? '';
}

function renderBoardWithQuery(getPosts: PostsContextValue['getPosts'], url = '/board/free') {
  const context: PostsContextValue = {
    getPosts,
    getPost: vi.fn(),
    getMyPosts: vi.fn(),
    createPost: vi.fn(),
    updatePost: vi.fn(),
    updateViewCount: vi.fn(),
    deletePost: vi.fn(),
  };
  render(
    <PostsContext.Provider value={context}>
      <MemoryRouter initialEntries={[url]}>
        <HistoryControls />
        <Routes>
          <Route path="/board/:boardType" element={<BoardPage />} />
        </Routes>
      </MemoryRouter>
    </PostsContext.Provider>
  );
}

async function renderBoard(url = '/board/free', boardPosts = posts) {
  renderBoardWithQuery(vi.fn().mockResolvedValue(boardPosts), url);
  const input = await screen.findByRole<HTMLInputElement>('textbox', { name: '검색어' });
  return { input };
}

function visiblePostTitles() {
  return screen.queryAllByRole('link').map((link) => link.textContent);
}

// 실제 네트워크나 타이머 없이 요청의 완료 시점과 순서를 제어한다.
function createPendingPostsRequest() {
  let resolve!: (value: Post[]) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<Post[]>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('BoardPage URL navigation', () => {
  it('keeps draft input unapplied, then restores the URL, input and results on back and forward', async () => {
    const { input } = await renderBoard();
    const originalTitles = visiblePostTitles();
    expect(originalTitles).toHaveLength(10);

    fireEvent.change(input, { target: { value: '질문' } });
    expect(currentSearch()).toBe('');
    expect(visiblePostTitles()).toEqual(originalTitles);

    fireEvent.click(screen.getByRole('button', { name: '검색' }));
    await waitFor(() => expect(visiblePostTitles()).toHaveLength(2));
    const searchedUrl = currentSearch();
    expect(new URLSearchParams(searchedUrl).get('keyword')).toBe('질문');
    expect(new URLSearchParams(searchedUrl).get('page')).toBe('1');
    expect(visiblePostTitles().every((title) => title?.includes('질문'))).toBe(true);

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: '이전 기록' })); });
    expect(currentSearch()).toBe('');
    expect(input.value).toBe('');
    expect(visiblePostTitles()).toEqual(originalTitles);

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: '다음 기록' })); });
    expect(currentSearch()).toBe(searchedUrl);
    expect(input.value).toBe('질문');
    expect(visiblePostTitles()).toHaveLength(2);
  });

  it('prevents default form submission and preserves category and sort', async () => {
    const { input } = await renderBoard('/board/free?category=question&sort=asc&page=2');
    fireEvent.change(input, { target: { value: '질문' } });
    const form = input.closest('form');
    if (!form) throw new Error('검색 폼이 없습니다.');

    // Enter submits this same form; jsdom does not simulate keyboard default actions.
    expect(fireEvent.submit(form)).toBe(false);
    await waitFor(() => expect(new URLSearchParams(currentSearch()).get('keyword')).toBe('질문'));
    const params = new URLSearchParams(currentSearch());
    expect(params.get('category')).toBe('question');
    expect(params.get('sort')).toBe('asc');
    expect(params.get('page')).toBe('1');
    expect(visiblePostTitles()).toEqual(['[질문]질문 12']);
  });

  it('restores the previous page and sort with a single back navigation per action', async () => {
    await renderBoard();
    const firstPageTitles = visiblePostTitles();
    fireEvent.click(screen.getByRole('button', { name: '다음 페이지로 이동' }));
    await waitFor(() => expect(visiblePostTitles()).toHaveLength(2));
    const secondPageTitles = visiblePostTitles();
    expect(new URLSearchParams(currentSearch()).get('page')).toBe('2');

    fireEvent.click(screen.getByRole('button', { name: '최신 순' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: '오래된 순' })).not.toBeNull());
    expect(new URLSearchParams(currentSearch()).get('page')).toBe('1');
    expect(visiblePostTitles()[0]).toBe('[수다]일반 글 1');

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: '이전 기록' })); });
    expect(new URLSearchParams(currentSearch()).get('page')).toBe('2');
    expect(screen.queryByRole('button', { name: '최신 순' })).not.toBeNull();
    expect(visiblePostTitles()).toEqual(secondPageTitles);

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: '이전 기록' })); });
    expect(currentSearch()).toBe('');
    expect(visiblePostTitles()).toEqual(firstPageTitles);
  });

  it('restores category, search and page after changing the category', async () => {
    const { input } = await renderBoard('/board/free?keyword=질문&sort=asc&page=2');
    const originalUrl = currentSearch();
    const originalTitles = visiblePostTitles();
    fireEvent.click(screen.getByRole('button', { name: '질문' }));
    await waitFor(() => expect(visiblePostTitles()).toEqual(['[질문]질문 12']));
    expect(screen.getByRole('button', { name: '질문' }).getAttribute('aria-pressed')).toBe('true');
    const params = new URLSearchParams(currentSearch());
    expect(params.get('keyword')).toBe('질문');
    expect(params.get('sort')).toBe('asc');
    expect(params.get('page')).toBe('1');

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: '이전 기록' })); });
    expect(currentSearch()).toBe(originalUrl);
    expect(input.value).toBe('질문');
    expect(screen.getByRole('button', { name: '전체' }).getAttribute('aria-pressed')).toBe('true');
    expect(visiblePostTitles()).toEqual(originalTitles);
  });

  it.each([
    ['-1', 10, '[수다]일반 글 3'],
    ['0', 10, '[수다]일반 글 3'],
    ['abc', 10, '[수다]일반 글 3'],
    ['1.5', 10, '[수다]일반 글 3'],
    ['999', 2, '[수다]일반 글 1'],
  ])('shows a valid page for a direct URL with page=%s', async (page, count, lastTitle) => {
    await renderBoard(`/board/free?page=${page}`);
    expect(visiblePostTitles()).toHaveLength(count);
    expect(visiblePostTitles().slice(-1)[0]).toBe(lastTitle);
    expect(currentSearch()).toBe(`?page=${page}`);
  });
});

describe('BoardPage request failures and stale responses', () => {
  it('distinguishes a failed query from an empty board and recovers on retry', async () => {
    const retryRequest = createPendingPostsRequest();
    const getPosts = vi.fn<PostsContextValue['getPosts']>()
      .mockRejectedValueOnce(new Error('조회 실패'))
      .mockReturnValueOnce(retryRequest.promise);
    renderBoardWithQuery(getPosts);

    expect((await screen.findByRole('alert')).textContent)
      .toBe('게시글을 불러오지 못했습니다.');
    expect(screen.queryByText('아직 등록된 게시글이 없습니다.')).toBeNull();
    expect(screen.queryByRole('textbox', { name: '검색어' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(getPosts).toHaveBeenCalledTimes(2);
    expect(getPosts).toHaveBeenNthCalledWith(1, 'free');
    expect(getPosts).toHaveBeenNthCalledWith(2, 'free');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('button', { name: '다시 시도' })).toBeNull();
    expect(screen.queryByRole('textbox', { name: '검색어' })).toBeNull();

    await act(async () => { retryRequest.resolve(posts); });
    expect(screen.queryByRole('textbox', { name: '검색어' })).not.toBeNull();
    expect(visiblePostTitles()).toHaveLength(10);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('allows another retry after a repeated failure and shows a successful empty result', async () => {
    const getPosts = vi.fn<PostsContextValue['getPosts']>()
      .mockRejectedValueOnce(new Error('첫 번째 실패'))
      .mockRejectedValueOnce(new Error('두 번째 실패'))
      .mockResolvedValueOnce([]);
    renderBoardWithQuery(getPosts);

    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect((await screen.findByRole('alert')).textContent)
      .toBe('게시글을 불러오지 못했습니다.');
    expect(screen.queryByText('아직 등록된 게시글이 없습니다.')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect((await screen.findByRole('status')).textContent)
      .toBe('아직 등록된 게시글이 없습니다.');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(getPosts).toHaveBeenCalledTimes(3);
  });

  it.each(['success', 'failure'] as const)(
    'ignores an old %s while the current board is still loading',
    async (outcome) => {
      const oldRequest = createPendingPostsRequest();
      const currentRequest = createPendingPostsRequest();
      const getPosts = vi.fn<PostsContextValue['getPosts']>()
        .mockReturnValueOnce(oldRequest.promise)
        .mockReturnValueOnce(currentRequest.promise);
      renderBoardWithQuery(getPosts);
      fireEvent.click(screen.getByRole('button', { name: '공지사항으로 이동' }));
      expect(getPosts).toHaveBeenNthCalledWith(2, 'notice');

      await act(async () => {
        if (outcome === 'success') oldRequest.resolve(posts);
        else oldRequest.reject(new Error('이전 게시판 조회 실패'));
      });

      expect(screen.queryByRole('heading', { name: '공지사항' })).not.toBeNull();
      expect(screen.queryByRole('textbox', { name: '검색어' })).toBeNull();
      expect(screen.queryByRole('alert')).toBeNull();
      expect(screen.queryByText('아직 등록된 게시글이 없습니다.')).toBeNull();
      expect(visiblePostTitles()).toHaveLength(0);

      await act(async () => { currentRequest.resolve([]); });
      expect(screen.getByRole('status').textContent)
        .toBe('아직 등록된 게시글이 없습니다.');
      expect(screen.queryByRole('alert')).toBeNull();
    }
  );

  it.each(['success', 'failure'] as const)(
    'keeps the current board results when an old request finishes with %s',
    async (outcome) => {
      const oldRequest = createPendingPostsRequest();
      const noticePost: Post = {
        ...posts[0], id: 'notice-post', boardType: 'notice', title: '현재 공지사항',
      };
      const getPosts = vi.fn<PostsContextValue['getPosts']>()
        .mockReturnValueOnce(oldRequest.promise)
        .mockResolvedValueOnce([noticePost]);
      renderBoardWithQuery(getPosts);
      fireEvent.click(screen.getByRole('button', { name: '공지사항으로 이동' }));
      await screen.findByRole('textbox', { name: '검색어' });
      const currentTitles = visiblePostTitles();
      expect(currentTitles).toHaveLength(1);
      expect(currentTitles[0]).toContain('현재 공지사항');

      await act(async () => {
        if (outcome === 'success') oldRequest.resolve(posts);
        else oldRequest.reject(new Error('이전 게시판 조회 실패'));
      });

      expect(visiblePostTitles()).toEqual(currentTitles);
      expect(screen.queryByRole('alert')).toBeNull();
      expect(screen.queryByRole('heading', { name: '공지사항' })).not.toBeNull();
    }
  );
});

describe('BoardPage empty results', () => {
  it('shows search feedback, keeps navigation at page 1 and recovers when the search is cleared', async () => {
    const { input } = await renderBoard();
    fireEvent.change(input, { target: { value: '없는글테스트' } });
    fireEvent.click(screen.getByRole('button', { name: '검색' }));
    expect((await screen.findByRole('status')).textContent).toBe('검색 결과가 없습니다. 다른 검색어로 검색해 보세요.');
    expect(visiblePostTitles()).toHaveLength(0);

    for (const name of ['다음 페이지로 이동', '마지막 페이지로 이동']) {
      fireEvent.click(screen.getByRole('button', { name }));
      expect(new URLSearchParams(currentSearch()).get('page')).toBe('1');
    }

    fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: '검색' }));
    await waitFor(() => expect(visiblePostTitles()).toHaveLength(10));
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('distinguishes an empty category from an empty board', async () => {
    await renderBoard('/board/free?category=question', posts.filter((post) => post.category !== 'question'));
    expect(screen.getByRole('status').textContent).toBe('이 카테고리에 등록된 게시글이 없습니다.');
  });

  it('shows the empty board message when there are no posts at all', async () => {
    await renderBoard('/board/free', []);
    expect(screen.getByRole('status').textContent).toBe('아직 등록된 게시글이 없습니다.');
  });
});
