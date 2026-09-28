import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Comment as CommentData } from '../../utils/comment';
import PostCommentSection from './PostCommentSection';

const commentMocks = vi.hoisted(() => ({
  getCommentsFromDB: vi.fn(),
  createCommentInDB: vi.fn(),
}));

vi.mock('../../utils/comment', () => commentMocks);
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, avatarUrl: '', nicknameUrl: '' }),
}));
vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: vi.fn() }),
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
    writerEmail: null,
    displayName: null,
    photoURL: null,
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PostCommentSection request state', () => {
  it('ignores an older post response that resolves after the current post', async () => {
    const firstRequest = deferredComments();
    const secondRequest = deferredComments();
    commentMocks.getCommentsFromDB
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise);

    const view = render(<PostCommentSection boardType="free" postId="first" />);
    view.rerender(<PostCommentSection boardType="free" postId="second" />);

    await act(async () => {
      secondRequest.resolve([createComment('second', '현재 댓글')]);
    });
    expect(screen.getByText('현재 댓글')).toBeTruthy();

    await act(async () => {
      firstRequest.resolve([createComment('first', '이전 댓글')]);
    });

    expect(screen.queryByText('이전 댓글')).toBeNull();
    expect(screen.getByText('현재 댓글')).toBeTruthy();
  });
});
