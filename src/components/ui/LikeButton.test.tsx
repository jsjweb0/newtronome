import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { onSnapshot } from 'firebase/firestore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ComponentProps } from 'react';
import { commentQueryKeys } from '../../features/board/queries/commentQueryKeys';
import LikeButton from './LikeButton';

const mocks = vi.hoisted(() => ({
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
  useAuth: () => ({ user: { uid: 'user-1' } }),
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

function renderLikeButton(props: Partial<ComponentProps<typeof LikeButton>> = {}) {
  render(
    <QueryClientProvider client={queryClient}>
      <LikeButton collection="free" docId="post-1" {...props} />
    </QueryClientProvider>,
  );
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
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mocks.subscriptions.length = 0;
  mocks.setDoc.mockResolvedValue(undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  queryClient.clear();
  vi.restoreAllMocks();
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
  it('does not write before the first subscription response', () => {
    const button = renderLikeButton();

    expect(button.disabled).toBe(true);
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
    expect(button.disabled).toBe(true);
  });

  it('restores the displayed count and like state when saving fails', async () => {
    const button = renderLikeButton();
    publishLikeSnapshot([], 0);
    mocks.setDoc.mockRejectedValueOnce(new Error('write failed'));

    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.getByText('0')).toBeTruthy();
    expect(button.querySelector('svg')?.classList.contains('fill-red-500!')).toBe(false);
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
    expect(button.querySelector('svg')?.classList.contains('fill-red-500!')).toBe(false);

    act(() => mocks.subscriptions[0].onSuccess({
      data: () => ({ likedUsers: ['user-1'], likeCount: 1 }),
      metadata: { hasPendingWrites: false },
    }));
    expect(screen.getByText('1')).toBeTruthy();
    expect(button.querySelector('svg')?.classList.contains('fill-red-500!')).toBe(true);
  });
});
