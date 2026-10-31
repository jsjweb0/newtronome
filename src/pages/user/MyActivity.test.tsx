import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Post } from '../../features/board/types/post';
import {
  deletePostFromFirestore,
  fetchMyPostsFromFirestore,
} from '../../features/board/services/postsService';
import MyActivity from './MyActivity';
import { fetchCommentCount, fetchMyComments } from '../../features/board/services/commentsService';

const testState = vi.hoisted(() => ({
  user: {
    uid: 'user-1',
    email: 'user-1@example.com',
    displayName: '사용자 1',
    photoURL: null,
    isAdmin: false,
  },
  firebaseUser: {
    uid: 'user-1',
    email: 'user-1@example.com',
  },
  showToast: vi.fn(),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: testState.user,
    loading: false,
  }),
}));

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: testState.showToast }),
}));

vi.mock('../../firebase', () => ({
  auth: {
    get currentUser() {
      return testState.firebaseUser;
    },
  },
}));

vi.mock('../../features/board/services/postsService', () => ({
  fetchMyPostsFromFirestore: vi.fn(),
  deletePostFromFirestore: vi.fn(),
}));

vi.mock('../../components/board/MyCommentSection', () => ({
  default: () => <p>댓글 영역</p>,
}));

vi.mock('../../components/board/PostListSkeleton', () => ({
  default: () => <div aria-hidden="true" />,
}));

vi.mock('../../features/board/services/commentsService', () => ({
  fetchCommentCount: vi.fn().mockResolvedValue(0),
  fetchMyComments: vi.fn().mockResolvedValue([]),
}));

function createPost(
  id: string,
  title: string,
  boardType: Post['boardType'],
): Post {
  return {
    id,
    boardType,
    title,
    content: '테스트 본문',
    authorUid: testState.user.uid,
    displayName: testState.user.displayName,
    photoURL: null,
    category: boardType === 'free' ? 'chat' : null,
    date: new Date('2026-01-01'),
    updatedAt: null,
    likeCount: 0,
    likedUsers: [],
    viewCount: 0,
    isNotice: boardType === 'notice',
  };
}

function createPendingPostsRequest() {
  let resolve!: (posts: Post[]) => void;
  const promise = new Promise<Post[]>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

function createTestView() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const createView = () => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/my-activity']}>
        <MyActivity />
      </MemoryRouter>
    </QueryClientProvider>
  );
  const rendered = render(createView());

  return {
    queryClient,
    ...rendered,
    rerenderView: () => rendered.rerender(createView()),
  };
}

function totalPostCount() {
  const label = screen.getByText('총 게시물');
  return label.parentElement?.parentElement?.querySelector('h3')?.textContent;
}

beforeEach(() => {
  vi.mocked(fetchCommentCount).mockResolvedValue(0);
  vi.mocked(fetchMyComments).mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
  testState.user = {
    uid: 'user-1',
    email: 'user-1@example.com',
    displayName: '사용자 1',
    photoURL: null,
    isAdmin: false,
  };
  testState.firebaseUser = {
    uid: 'user-1',
    email: 'user-1@example.com',
  };
});

describe('MyActivity 게시글 조회 상태', () => {
  it('조회 중에는 로딩 상태와 미확정 총 게시물 수를 표시한다', () => {
    const pendingRequest = createPendingPostsRequest();
    vi.mocked(fetchMyPostsFromFirestore).mockReturnValue(pendingRequest.promise);

    createTestView();

    expect(screen.getByRole('status').textContent)
      .toBe('내 게시글을 불러오는 중입니다.');
    expect(totalPostCount()).toBe('—');
    expect(screen.queryByText('작성한 글이 없습니다.')).toBeNull();
  });

  it('두 게시판이 모두 비어 있으면 빈 목록과 총 게시물 0개를 표시한다', async () => {
    vi.mocked(fetchMyPostsFromFirestore).mockResolvedValue([]);

    createTestView();

    expect(await screen.findByText('작성한 글이 없습니다.')).toBeTruthy();
    expect(totalPostCount()).toBe('0');
  });

  it('조회 오류를 표시하고 다시 시도하면 목록을 복구한다', async () => {
    const freePost = createPost('free-1', '재시도로 불러온 글', 'free');
    vi.mocked(fetchMyPostsFromFirestore)
      .mockRejectedValueOnce(new Error('공지사항 조회 실패'))
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([freePost]);

    createTestView();

    expect((await screen.findByRole('alert')).textContent)
      .toContain('내 게시글을 불러오지 못했습니다.');

    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByRole('link', { name: '재시도로 불러온 글' }))
      .toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(totalPostCount()).toBe('1');
    expect(fetchMyPostsFromFirestore).toHaveBeenCalledTimes(4);
  });
});

describe('MyActivity 사용자 및 삭제 동기화', () => {
  it('계정이 바뀌는 동안 이전 사용자의 글을 표시하지 않는다', async () => {
    const oldPost = createPost('old-post', '이전 사용자 글', 'free');
    const newPost = createPost('new-post', '새 사용자 글', 'free');
    const newUserRequest = createPendingPostsRequest();

    vi.mocked(fetchMyPostsFromFirestore).mockImplementation((boardType) => {
      if (testState.firebaseUser.uid === 'user-2') {
        return boardType === 'free' ? newUserRequest.promise : Promise.resolve([]);
      }

      return Promise.resolve(boardType === 'free' ? [oldPost] : []);
    });

    const { rerenderView } = createTestView();
    expect(await screen.findByRole('link', { name: '이전 사용자 글' }))
      .toBeTruthy();

    testState.user = {
      uid: 'user-2',
      email: 'user-2@example.com',
      displayName: '사용자 2',
      photoURL: null,
      isAdmin: false,
    };
    testState.firebaseUser = {
      uid: 'user-2',
      email: 'user-2@example.com',
    };

    rerenderView();

    expect(screen.queryByText('이전 사용자 글')).toBeNull();
    expect(screen.getByRole('status').textContent)
      .toBe('내 게시글을 불러오는 중입니다.');

    await act(async () => {
      newUserRequest.resolve([newPost]);
    });

    expect(await screen.findByRole('link', { name: '새 사용자 글' }))
      .toBeTruthy();
    expect(screen.queryByText('이전 사용자 글')).toBeNull();
  });

  it('삭제 후 목록과 총 게시물 수를 함께 갱신한다', async () => {
    let freePosts = [
      createPost('free-1', '삭제할 글', 'free'),
      createPost('free-2', '남아 있을 글', 'free'),
    ];

    vi.mocked(fetchMyPostsFromFirestore).mockImplementation((boardType) =>
      Promise.resolve(boardType === 'free' ? freePosts : []),
    );
    vi.mocked(deletePostFromFirestore).mockImplementation(async (_boardType, postId) => {
      freePosts = freePosts.filter((post) => post.id !== postId);
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    createTestView();

    expect(await screen.findByRole('link', { name: '삭제할 글' })).toBeTruthy();
    expect(totalPostCount()).toBe('2');

    const deleteButtons = screen.getAllByRole('button', { name: '삭제' });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText('삭제할 글')).toBeNull();
    });
    expect(screen.getByRole('link', { name: '남아 있을 글' })).toBeTruthy();
    expect(totalPostCount()).toBe('1');
    expect(deletePostFromFirestore).toHaveBeenCalledWith('free', 'free-1');
    expect(testState.showToast).toHaveBeenCalledWith({
      message: '게시글이 삭제되었습니다.',
      type: 'success',
    });
  });
});
