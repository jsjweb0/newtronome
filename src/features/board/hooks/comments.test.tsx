import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as service from '../services/commentsService';
import type { Comment } from '../types/comment';
import { commentQueryKeys as keys } from '../queries/commentQueryKeys';
import { useCommentsQuery } from './useCommentsQuery';
import { useMyCommentsQuery } from './useMyCommentsQuery';
import { useCommentCountQuery } from './useCommentCountQuery';
import { useCreateComment } from './useCreateComment';
import { useUpdateComment } from './useUpdateComment';
import { useDeleteComment } from './useDeleteComment';

vi.mock('../services/commentsService', () => ({
  fetchComments: vi.fn(), fetchMyComments: vi.fn(), fetchCommentCount: vi.fn(),
  createCommentInFirestore: vi.fn(), updateCommentInFirestore: vi.fn(),
  deleteCommentFromFirestore: vi.fn(),
}));

const comment: Comment = {
  id: 'c1', boardType: 'free', postId: 'p1', content: '기존 댓글',
  createdAt: new Date('2026-01-01'), likeCount: 0, liked: false,
  writerUid: 'u1', writerEmail: null, displayName: null, photoURL: null,
};
const input = {
  content: '새 댓글', writerUid: 'u1', writerEmail: null,
  displayName: null, photoURL: null,
};
const target = { boardType: 'free' as const, postId: 'p1', commentId: 'c1' };
const clients: QueryClient[] = [];

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(service.fetchComments).mockResolvedValue([comment]);
  vi.mocked(service.fetchMyComments).mockResolvedValue([comment]);
  vi.mocked(service.fetchCommentCount).mockResolvedValue(1);
});
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
});

describe('댓글 조회 Query', () => {
  it('사용자가 바뀌면 이전 liked 값을 표시하지 않고 별도 캐시에 저장한다', async () => {
    const { client, wrapper } = setup();
    vi.mocked(service.fetchComments).mockImplementation(async (_board, _post, uid) => [
      { ...comment, liked: uid === 'u1' },
    ]);
    const { result, rerender } = renderHook(
      ({ uid }) => useCommentsQuery('free', 'p1', uid),
      { wrapper, initialProps: { uid: 'u1' } },
    );
    await waitFor(() => expect(result.current.data?.[0].liked).toBe(true));
    rerender({ uid: 'u2' });
    expect(result.current.data).toBeUndefined();
    await waitFor(() => expect(result.current.data?.[0].liked).toBe(false));
    expect(client.getQueryData<Comment[]>(keys.postForViewer('free', 'p1', 'u1'))?.[0].liked).toBe(true);
  });

  it('계정 전환 후 늦게 도착한 내 댓글 응답이 현재 계정 목록을 덮어쓰지 않는다', async () => {
    const { wrapper } = setup();
    let resolveOld!: (value: Comment[]) => void;
    vi.mocked(service.fetchMyComments)
      .mockReturnValueOnce(new Promise((resolve) => { resolveOld = resolve; }))
      .mockResolvedValueOnce([{ ...comment, id: 'c2', writerUid: 'u2' }]);
    const { result, rerender } = renderHook(({ uid }) => useMyCommentsQuery(uid), {
      wrapper, initialProps: { uid: 'u1' },
    });
    rerender({ uid: 'u2' });
    await waitFor(() => expect(result.current.data?.[0].writerUid).toBe('u2'));
    await act(async () => { resolveOld([comment]); });
    expect(result.current.data?.[0].writerUid).toBe('u2');
  });

  it('개수 조회 실패를 0개로 바꾸지 않고 재시도 후 실제 0개를 반환한다', async () => {
    const { wrapper } = setup();
    vi.mocked(service.fetchCommentCount)
      .mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(0);
    const { result } = renderHook(() => useCommentCountQuery('free', 'p1'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(result.current.data).toBe(0));
    expect(result.current.isSuccess).toBe(true);
  });
});

describe('댓글 Mutation과 캐시 갱신', () => {
  it.each(['create', 'update', 'delete'] as const)(
    '%s 성공 시 게시글·내 댓글을 갱신하고 개수는 등록·삭제 때 갱신한다',
    async (operation) => {
      const { client, wrapper } = setup();
      let rows = [comment];
      vi.mocked(service.fetchComments).mockImplementation(async () => rows);
      vi.mocked(service.fetchMyComments).mockImplementation(async () => rows);
      vi.mocked(service.fetchCommentCount).mockImplementation(async () => rows.length);
      vi.mocked(service.createCommentInFirestore).mockImplementation(async () => {
        const created = { ...comment, id: 'c2', content: input.content };
        rows = [created, ...rows];
        return created;
      });
      vi.mocked(service.updateCommentInFirestore).mockImplementation(async () => {
        rows = [{ ...comment, content: '수정된 댓글' }];
      });
      vi.mocked(service.deleteCommentFromFirestore).mockImplementation(async () => { rows = []; });

      const inactiveKey = keys.postForViewer('free', 'p1', 'other-user');
      const unrelatedKey = keys.postForViewer('free', 'other-post', 'u1');
      client.setQueryData(inactiveKey, [comment]);
      client.setQueryData(unrelatedKey, [comment]);
      const { result } = renderHook(() => ({
        post: useCommentsQuery('free', 'p1', 'u1'),
        mine: useMyCommentsQuery('u1'),
        count: useCommentCountQuery('free', 'p1'),
        create: useCreateComment(), update: useUpdateComment(), remove: useDeleteComment(),
      }), { wrapper });
      await waitFor(() => {
        expect(result.current.post.isSuccess).toBe(true);
        expect(result.current.mine.isSuccess).toBe(true);
        expect(result.current.count.isSuccess).toBe(true);
      });

      await act(async () => {
        if (operation === 'create') {
          await result.current.create.mutateAsync({ boardType: 'free', postId: 'p1', input });
        } else if (operation === 'update') {
          await result.current.update.mutateAsync({ ...target, content: '수정된 댓글' });
        } else {
          await result.current.remove.mutateAsync(target);
        }
      });
      await waitFor(() => {
        expect(result.current.post.data).toEqual(rows);
        expect(result.current.mine.data).toEqual(rows);
        expect(result.current.count.data).toBe(rows.length);
      });
      expect(service.fetchComments).toHaveBeenCalledTimes(2);
      expect(service.fetchMyComments).toHaveBeenCalledTimes(2);
      expect(service.fetchCommentCount).toHaveBeenCalledTimes(operation === 'update' ? 1 : 2);
      expect(client.getQueryState(inactiveKey)?.isInvalidated).toBe(true);
      expect(client.getQueryState(unrelatedKey)?.isInvalidated).toBe(false);
      if (operation === 'create') expect(service.createCommentInFirestore).toHaveBeenCalledWith('free', 'p1', input);
      if (operation === 'update') expect(service.updateCommentInFirestore).toHaveBeenCalledWith('free', 'p1', 'c1', '수정된 댓글');
      if (operation === 'delete') expect(service.deleteCommentFromFirestore).toHaveBeenCalledWith('free', 'p1', 'c1');
    },
  );

  it.each(['create', 'update', 'delete'] as const)('%s 실패 시 캐시를 변경하지 않는다', async (operation) => {
    const { client, wrapper } = setup();
    const error = new Error('permission denied');
    vi.mocked(service.createCommentInFirestore).mockRejectedValue(error);
    vi.mocked(service.updateCommentInFirestore).mockRejectedValue(error);
    vi.mocked(service.deleteCommentFromFirestore).mockRejectedValue(error);
    const cachedKeys = [keys.postForViewer('free', 'p1', 'u1'), keys.mine('u1'), keys.count('free', 'p1')];
    client.setQueryData(cachedKeys[0], [comment]);
    client.setQueryData(cachedKeys[1], [comment]);
    client.setQueryData(cachedKeys[2], 1);
    const { result } = renderHook(() => ({
      create: useCreateComment(), update: useUpdateComment(), remove: useDeleteComment(),
    }), { wrapper });
    await act(async () => {
      const request = operation === 'create'
        ? result.current.create.mutateAsync({ boardType: 'free', postId: 'p1', input })
        : operation === 'update'
          ? result.current.update.mutateAsync({ ...target, content: '수정' })
          : result.current.remove.mutateAsync(target);
      await expect(request).rejects.toThrow('permission denied');
    });
    expect(client.getQueryData(cachedKeys[0])).toEqual([comment]);
    expect(client.getQueryData(cachedKeys[1])).toEqual([comment]);
    expect(client.getQueryData(cachedKeys[2])).toBe(1);
    for (const key of cachedKeys) expect(client.getQueryState(key)?.isInvalidated).toBe(false);
  });
});
