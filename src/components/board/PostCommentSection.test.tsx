import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { commentQueryKeys } from '../../features/board/queries/commentQueryKeys';
import type { Comment as CommentData } from '../../features/board/types/comment';
import PostCommentSection from './PostCommentSection';

const commentMocks = vi.hoisted(() => ({
  fetchComments: vi.fn(),
  createCommentInFirestore: vi.fn(),
}));
const state = vi.hoisted(() => ({
  user: null as null | { uid: string; email: string; displayName: string; photoURL: null },
  showToast: vi.fn(),
}));

vi.mock('../../features/board/services/commentsService', () => commentMocks);
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: state.user, avatarUrl: '/avatar.png', nicknameUrl: '/avatar.png' }),
}));
vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: state.showToast }),
}));
vi.mock('../../contexts/NotificationContext', () => ({
  useNotifications: () => ({ addNotification: vi.fn() }),
}));
vi.mock('./Comment', () => ({
  default: ({ data }: { data: CommentData }) => <p>{data.content}</p>,
}));

function deferredComments() {
  let resolve!: (comments: CommentData[]) => void;
  const promise = new Promise<CommentData[]>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function createComment(id: string, content: string): CommentData {
  return {
    id,
    boardType: 'free',
    postId: id,
    content,
    createdAt: new Date(),
    likeCount: 0,
    liked: false,
    writerUid: null,
    displayName: null,
    photoURL: null,
  };
}

const clients: QueryClient[] = [];

function renderSection(postId = 'first') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  const viewFor = (id: string) => (
    <QueryClientProvider client={client}>
      <PostCommentSection boardType="free" postId={id} />
    </QueryClientProvider>
  );
  const view = render(viewFor(postId));
  return { client, ...view, changePost: (id: string) => view.rerender(viewFor(id)) };
}

beforeEach(() => {
  vi.resetAllMocks();
  state.user = null;
  commentMocks.fetchComments.mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
});

describe('PostCommentSection request state', () => {
  it('ignores an older post response that resolves after the current post', async () => {
    const firstRequest = deferredComments();
    const secondRequest = deferredComments();
    commentMocks.fetchComments
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise);

    const view = renderSection();
    view.changePost('second');

    await act(async () => {
      secondRequest.resolve([createComment('second', '현재 댓글')]);
    });
    expect(await screen.findByText('현재 댓글')).toBeTruthy();

    await act(async () => {
      firstRequest.resolve([createComment('first', '이전 댓글')]);
    });

    expect(screen.queryByText('이전 댓글')).toBeNull();
    expect(screen.getByText('현재 댓글')).toBeTruthy();
  });

  it('조회 오류를 표시하고 재시도로 빈 목록을 복구한다', async () => {
    commentMocks.fetchComments.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([]);
    renderSection();
    expect((await screen.findByRole('alert')).textContent).toContain('댓글을 불러오지 못했습니다.');
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(await screen.findByText('Comments')).toBeTruthy();
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('백그라운드 조회 실패 시 기존 댓글과 재시도 안내를 유지한다', async () => {
    commentMocks.fetchComments.mockResolvedValueOnce([createComment('c1', '기존 댓글')]);
    const { client } = renderSection();
    await screen.findByText('기존 댓글');
    commentMocks.fetchComments.mockRejectedValueOnce(new Error('offline'));
    await act(async () => {
      await client.invalidateQueries({ queryKey: commentQueryKeys.post('free', 'first') });
    });
    expect((await screen.findByRole('alert')).textContent).toContain('이전 댓글을 표시합니다.');
    expect(screen.getByText('기존 댓글')).toBeTruthy();
  });

  it('빈 입력은 저장하지 않고 입력창으로 포커스를 옮긴다', async () => {
    state.user = { uid: 'u1', email: 'user@example.com', displayName: '사용자', photoURL: null };
    renderSection();
    const textbox = await screen.findByRole('textbox');
    fireEvent.change(textbox, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: '작성' }));
    expect(commentMocks.createCommentInFirestore).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(textbox);
  });

  it('중복 제출을 막고 저장 후 재조회한 댓글을 표시하며 입력을 초기화한다', async () => {
    state.user = { uid: 'u1', email: 'user@example.com', displayName: '사용자', photoURL: null };
    const created = createComment('c1', '등록된 댓글');
    let resolve!: (value: CommentData) => void;
    commentMocks.createCommentInFirestore.mockReturnValue(new Promise((done) => { resolve = done; }));
    commentMocks.fetchComments.mockResolvedValueOnce([]).mockResolvedValueOnce([created]);
    renderSection();
    const textbox = await screen.findByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(textbox, { target: { value: '  등록된 댓글  ' } });
    fireEvent.submit(textbox.closest('form')!);
    fireEvent.submit(textbox.closest('form')!);
    await waitFor(() => expect(commentMocks.createCommentInFirestore).toHaveBeenCalledTimes(1));
    expect(commentMocks.createCommentInFirestore).toHaveBeenCalledWith('free', 'first', {
      content: '등록된 댓글', writerUid: 'u1',
      displayName: '사용자', photoURL: null,
    });
    await waitFor(() => expect(textbox.disabled).toBe(true));
    await act(async () => { resolve(created); });
    expect(await screen.findByText('등록된 댓글')).toBeTruthy();
    await waitFor(() => expect(textbox.value).toBe(''));
    expect(state.showToast).toHaveBeenCalledWith({ message: '댓글이 등록되었습니다.' });
  });

  it('등록 실패 시 입력을 보존하고 다시 제출할 수 있다', async () => {
    state.user = { uid: 'u1', email: 'user@example.com', displayName: '사용자', photoURL: null };
    commentMocks.createCommentInFirestore.mockRejectedValue(new Error('permission denied'));
    renderSection();
    const textbox = await screen.findByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(textbox, { target: { value: '보존할 입력' } });
    fireEvent.click(screen.getByRole('button', { name: '작성' }));
    await waitFor(() => expect(state.showToast).toHaveBeenCalledWith({
      message: '댓글 등록에 실패했습니다.', type: 'error',
    }));
    await waitFor(() => expect(textbox.disabled).toBe(false));
    expect(textbox.value).toBe('보존할 입력');
    expect(commentMocks.fetchComments).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: '작성' }));
    await waitFor(() => expect(commentMocks.createCommentInFirestore).toHaveBeenCalledTimes(2));
  });
});
