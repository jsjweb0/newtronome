import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { onSnapshot } from 'firebase/firestore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ComponentProps } from 'react';
import { commentQueryKeys } from '../../features/board/queries/commentQueryKeys';
import LikeButton from './LikeButton';

const mocks = vi.hoisted(() => ({
  user: { uid: 'user-1' } as { uid: string } | null,
  subscriptions: [] as Array<{
    onSuccess: (snapshot: {
      data: () => Record<string, unknown>;
      metadata?: { hasPendingWrites: boolean };
    }) => void;
    onError: (error: Error) => void;
  }>,
  setDoc: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mocks.user }),
}));
vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}));
vi.mock('../../firebase', () => ({ db: 'test-db' }));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => 'post-ref'),
  onSnapshot: vi.fn((_ref, _options, onSuccess, onError) => {
    mocks.subscriptions.push({ onSuccess, onError });
    return vi.fn();
  }),
  setDoc: mocks.setDoc,
  arrayUnion: vi.fn((uid: string) => ({ add: uid })),
  arrayRemove: vi.fn((uid: string) => ({ remove: uid })),
  increment: vi.fn((amount: number) => ({ amount })),
}));

let queryClient: QueryClient;

type LikeProps = Partial<ComponentProps<typeof LikeButton>>;

function renderLikeButtonView(props: LikeProps = {}) {
  const element = (nextProps: LikeProps) => (
    <QueryClientProvider client={queryClient}>
      <LikeButton collection="free" docId="post-1" {...nextProps} />
    </QueryClientProvider>
  );
  const view = render(element(props));
  return { rerender: (nextProps: LikeProps) => view.rerender(element(nextProps)) };
}

function renderLikeButton(props: LikeProps = {}) {
  renderLikeButtonView(props);
  return screen.getByRole<HTMLButtonElement>('button', { name: '좋아요' });
}

function seedCommentCaches(postId = 'post-1') {
  const related = [
    commentQueryKeys.postForViewer('free', postId, 'user-1'),
    commentQueryKeys.postForViewer('free', postId, 'user-2'),
    commentQueryKeys.mine('user-1'),
    commentQueryKeys.mine('user-2'),
  ];
  const unrelated = [
    commentQueryKeys.postForViewer('free', 'other-post', 'user-1'),
    commentQueryKeys.postForViewer('notice', postId, 'user-1'),
    commentQueryKeys.count('free', postId),
  ];
  for (const key of [...related, ...unrelated]) {
    queryClient.setQueryData(key, key[1] === 'count' ? 1 : []);
  }
  return { related, unrelated };
}

function publishLikeSnapshot(likedUsers: string[], likeCount: number) {
  act(() => {
    mocks.subscriptions[0].onSuccess({ data: () => ({ likedUsers, likeCount }) });
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = { uid: 'user-1' };
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mocks.subscriptions.length = 0;
  mocks.setDoc.mockResolvedValue(undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  queryClient.clear();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('LikeButton 공개 좋아요 수', () => {
  it('비로그인 사용자에게 전달받은 좋아요 수를 추가 조회 없이 표시한다', () => {
    mocks.user = null;
    const button = renderLikeButton({ initialCount: 7 });

    expect(screen.getByText('7')).toBeTruthy();
    expect(onSnapshot).not.toHaveBeenCalled();

    fireEvent.click(button);

    expect(mocks.setDoc).not.toHaveBeenCalled();
    expect(mocks.showToast).toHaveBeenCalledWith({
      message: '로그인 후 이용해 주세요!',
      type: 'info',
      action: { label: '로그인', to: '/login' },
    });
  });

  it('로그인 사용자는 전달값을 표시한 뒤 실시간 개수로 갱신한다', () => {
    renderLikeButton({ initialCount: 7 });

    expect(screen.getByText('7')).toBeTruthy();
    expect(onSnapshot).toHaveBeenCalledTimes(1);

    publishLikeSnapshot(['user-1'], 8);

    expect(screen.getByText('8')).toBeTruthy();
  });

  it('비로그인 상태에서 초기 개수가 없으면 공개 개수를 조회한다', () => {
    mocks.user = null;
    renderLikeButton();

    expect(onSnapshot).toHaveBeenCalledTimes(1);

    publishLikeSnapshot(['other-user'], 5);

    expect(screen.getByText('5')).toBeTruthy();
  });

  it('비로그인 상태에서 개수를 숨기면 공개 개수를 조회하지 않는다', () => {
    mocks.user = null;
    renderLikeButton({ showCount: false });

    expect(onSnapshot).not.toHaveBeenCalled();
  });
});

describe('댓글 좋아요와 Query 캐시 동기화', () => {
  it.each([false, true])('기존 liked=%s에서 저장 성공 시 댓글 목록과 내 댓글 캐시를 무효화한다', async (liked) => {
    const { related, unrelated } = seedCommentCaches();
    const button = renderLikeButton({ docId: 'comment-1', parentId: 'post-1', subCollection: 'comments' });
    publishLikeSnapshot(liked ? ['user-1'] : [], liked ? 1 : 0);

    await act(async () => { fireEvent.click(button); });

    expect(mocks.setDoc).toHaveBeenCalledWith('post-ref', {
      likeCount: { amount: liked ? -1 : 1 },
      likedUsers: liked ? { remove: 'user-1' } : { add: 'user-1' },
    }, { merge: true });
    for (const key of related) {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true);
    }
    for (const key of unrelated) {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false);
    }
    expect(mocks.showToast).toHaveBeenCalledWith({
      message: liked ? '좋아요를 취소했습니다.' : '좋아요를 눌렀습니다!',
    });
  });

  it('저장 완료 전에는 무효화하지 않고 실패 시에도 기존 캐시를 유지한다', async () => {
    const { related, unrelated } = seedCommentCaches();
    let reject!: (error: Error) => void;
    mocks.setDoc.mockReturnValueOnce(new Promise<void>((_resolve, rejectRequest) => { reject = rejectRequest; }));
    const button = renderLikeButton({ docId: 'comment-1', parentId: 'post-1', subCollection: 'comments' });
    publishLikeSnapshot([], 0);
    fireEvent.click(button);
    for (const key of related) {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false);
    }
    await act(async () => { reject(new Error('write failed')); });
    for (const key of [...related, ...unrelated]) {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false);
      expect(queryClient.getQueryData(key)).toEqual(key[1] === 'count' ? 1 : []);
    }
    expect(mocks.showToast).toHaveBeenCalledWith({ message: '좋아요 처리에 실패했습니다.', type: 'error' });
    expect(button.disabled).toBe(false);
  });

  it('게시글 좋아요는 댓글 캐시를 무효화하지 않는다', async () => {
    const { related, unrelated } = seedCommentCaches();
    const button = renderLikeButton();
    publishLikeSnapshot([], 0);
    await act(async () => { fireEvent.click(button); });
    expect(mocks.setDoc).toHaveBeenCalledTimes(1);
    for (const key of [...related, ...unrelated]) {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false);
    }
  });

  it('숫자 게시글 ID도 문자열 Query Key에 맞춰 무효화한다', async () => {
    const { related } = seedCommentCaches('123');
    const button = renderLikeButton({ docId: 'comment-1', parentId: 123, subCollection: 'comments' });
    publishLikeSnapshot([], 0);
    await act(async () => { fireEvent.click(button); });
    for (const key of related) {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true);
    }
  });
});

describe('LikeButton request state', () => {
  it.each(['heart', 'thumb'] as const)(
    'exposes the server-confirmed like state with aria-pressed (%s)',
    (type) => {
      const button = renderLikeButton({ type });

      publishLikeSnapshot([], 0);
      expect(button.getAttribute('aria-pressed')).toBe('false');

      publishLikeSnapshot(['user-1'], 1);
      expect(button.getAttribute('aria-pressed')).toBe('true');
    },
  );

  it('does not write before the first subscription response', () => {
    const button = renderLikeButton();

    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(button);
    expect(mocks.setDoc).not.toHaveBeenCalled();
  });

  it('does not toggle an unknown like state after a subscription failure', () => {
    const button = renderLikeButton();

    act(() => mocks.subscriptions[0].onError(new Error('permission denied')));
    expect(screen.getByRole('button', { name: /다시 시도/ })).toBe(button);
    expect(mocks.setDoc).not.toHaveBeenCalled();

    fireEvent.click(button);
    expect(mocks.setDoc).not.toHaveBeenCalled();
    expect(mocks.subscriptions).toHaveLength(2);
    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-disabled')).toBe('true');
  });

  it('restores the displayed count and like state when saving fails', async () => {
    const button = renderLikeButton();
    publishLikeSnapshot([], 0);
    mocks.setDoc.mockRejectedValueOnce(new Error('write failed'));

    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.getByText('0')).toBeTruthy();
    expect(button.querySelector('svg')?.classList.contains('fill-primary!')).toBe(false);
    expect(mocks.showToast).toHaveBeenCalledWith({
      message: '좋아요 처리에 실패했습니다.',
      type: 'error',
    });
  });

  it('sends only one write for repeated clicks while a save is pending', () => {
    const button = renderLikeButton();
    publishLikeSnapshot([], 0);
    mocks.setDoc.mockImplementation(() => new Promise<void>(() => undefined));

    fireEvent.click(button);
    fireEvent.click(button);

    expect(mocks.setDoc).toHaveBeenCalledTimes(1);
  });

  it('waits for the server-confirmed snapshot before changing the displayed like', () => {
    const button = renderLikeButton();
    publishLikeSnapshot([], 0);
    expect(onSnapshot).toHaveBeenCalledWith(
      'post-ref',
      { includeMetadataChanges: true },
      expect.any(Function),
      expect.any(Function)
    );

    act(() => mocks.subscriptions[0].onSuccess({
      data: () => ({ likedUsers: ['user-1'], likeCount: 1 }),
      metadata: { hasPendingWrites: true },
    }));
    expect(screen.getByText('0')).toBeTruthy();
    expect(button.querySelector('svg')?.classList.contains('fill-primary!')).toBe(false);

    act(() => mocks.subscriptions[0].onSuccess({
      data: () => ({ likedUsers: ['user-1'], likeCount: 1 }),
      metadata: { hasPendingWrites: false },
    }));
    expect(screen.getByText('1')).toBeTruthy();
    expect(button.querySelector('svg')?.classList.contains('fill-primary!')).toBe(true);
  });
});


describe('LikeButton 구독 유지와 키보드 포커스', () => {
  it('로그인 중 initialCount가 바뀌어도 구독을 재생성하거나 서버 표시값을 덮어쓰지 않는다', () => {
    const view = renderLikeButtonView({ initialCount: 7 });
    publishLikeSnapshot(['user-1'], 8);
    const button = screen.getByRole<HTMLButtonElement>('button', { name: '좋아요' });
    button.focus();
    view.rerender({ initialCount: 9 });

    expect(onSnapshot).toHaveBeenCalledOnce();
    expect(screen.getByText('8')).toBeTruthy();
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.getAttribute('aria-disabled')).toBe('false');
    expect(document.activeElement).toBe(button);
  });

  it('비로그인 중 initialCount 변경은 구독 없이 표시한다', () => {
    mocks.user = null;
    const view = renderLikeButtonView({ initialCount: 7 });
    view.rerender({ initialCount: 9 });
    expect(screen.getByText('9')).toBeTruthy();
    expect(screen.queryByText('7')).toBeNull();
    expect(onSnapshot).not.toHaveBeenCalled();
  });

  it('비로그인 전달값 표시에서 로그인으로 바뀌면 구독 응답을 기다린다', () => {
    mocks.user = null;
    const view = renderLikeButtonView({ initialCount: 7 });
    mocks.user = { uid: 'user-1' };
    view.rerender({ initialCount: 7 });
    const button = screen.getByRole<HTMLButtonElement>('button', { name: '좋아요' });
    expect(onSnapshot).toHaveBeenCalledOnce();
    expect(button.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(button);
    expect(mocks.setDoc).not.toHaveBeenCalled();
    publishLikeSnapshot(['user-1'], 8);
    expect(button.getAttribute('aria-disabled')).toBe('false');
    expect(screen.getByText('8')).toBeTruthy();
  });

  it.each(['heart', 'thumb'] as const)(
    '%s: 저장 대기 중 안내·포커스·중복 차단을 유지하고 성공하면 복구한다', async (type) => {
      vi.useFakeTimers();
      let resolveWrite!: () => void;
      mocks.setDoc.mockReturnValueOnce(new Promise<void>((resolve) => { resolveWrite = resolve; }));
      const button = renderLikeButton({ type });
      publishLikeSnapshot([], 0);
      button.focus();
      fireEvent.click(button);
      act(() => { vi.advanceTimersByTime(10_000); });

      expect(screen.getByRole('status').textContent).toBe('서버에 반영하는 중입니다.');
      expect(button.disabled).toBe(false);
      expect(button.getAttribute('aria-disabled')).toBe('true');
      expect(button.getAttribute('aria-busy')).toBe('true');
      expect(document.activeElement).toBe(button);
      expect(screen.getByText('0')).toBeTruthy();
      expect(button.getAttribute('aria-pressed')).toBe('false');
      fireEvent.click(button);
      expect(mocks.setDoc).toHaveBeenCalledOnce();

      publishLikeSnapshot(['user-1'], 1);
      await act(async () => { resolveWrite(); });
      expect(screen.queryByRole('status')).toBeNull();
      expect(button.getAttribute('aria-disabled')).toBe('false');
      expect(button.getAttribute('aria-busy')).toBe('false');
      expect(button.getAttribute('aria-pressed')).toBe('true');
      expect(document.activeElement).toBe(button);
      await act(async () => { fireEvent.click(button); });
      expect(mocks.setDoc).toHaveBeenCalledTimes(2);
      expect(mocks.setDoc).toHaveBeenLastCalledWith('post-ref', {
        likeCount: { amount: -1 }, likedUsers: { remove: 'user-1' },
      }, { merge: true });
    },
  );

  it.each(['heart', 'thumb'] as const)(
    '%s: 저장 실패 시 안내와 잠금을 해제하고 기존 상태·포커스를 유지한다', async (type) => {
      let rejectWrite!: (error: Error) => void;
      mocks.setDoc.mockReturnValueOnce(new Promise<void>((_resolve, reject) => { rejectWrite = reject; }));
      const button = renderLikeButton({ type });
      publishLikeSnapshot([], 0);
      button.focus();
      fireEvent.click(button);
      await act(async () => { rejectWrite(new Error('write failed')); });
      expect(screen.queryByRole('status')).toBeNull();
      expect(button.getAttribute('aria-disabled')).toBe('false');
      expect(button.getAttribute('aria-busy')).toBe('false');
      expect(button.getAttribute('aria-pressed')).toBe('false');
      expect(screen.getByText('0')).toBeTruthy();
      expect(document.activeElement).toBe(button);
      expect(mocks.showToast).toHaveBeenCalledWith({ message: '좋아요 처리에 실패했습니다.', type: 'error' });
    },
  );
});
