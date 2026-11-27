import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { ReactNode } from 'react';
import Comment from './Comment';

dayjs.extend(relativeTime);
const mocks = vi.hoisted(() => ({ update: vi.fn(), showToast: vi.fn() }));
vi.mock('../../contexts/ToastContext', () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
vi.mock('../../contexts/NotificationContext', () => ({ useNotifications: () => ({ addNotification: vi.fn() }) }));
vi.mock('../../features/board/hooks/useUpdateComment', () => ({ useUpdateComment: () => ({ mutateAsync: mocks.update, isPending: false }) }));
vi.mock('../../features/board/hooks/useDeleteComment', () => ({ useDeleteComment: () => ({ mutateAsync: vi.fn(), isPending: false }) }));
vi.mock('../auth/AuthAccess', () => ({ AuthAccess: ({ children }: { children: ReactNode }) => children }));
vi.mock('../ui/LikeButton', () => ({ default: () => null }));
vi.mock('../ui/ConfirmDialog', () => ({ default: () => null }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('댓글 수정 입력 제한', () => {
  it('너무 긴 댓글은 서버로 보내지 않고 수정 입력을 유지한다', () => {
    render(<Comment idx={0} boardType="free" postId="post-1" openDropdownId="comment-1" setOpenDropdownId={vi.fn()}
      data={{ id: 'comment-1', boardType: 'free', postId: 'post-1', content: '기존 댓글', createdAt: new Date(), likeCount: 0, liked: false, writerUid: 'user-1', displayName: '작성자', photoURL: null }} />);
    fireEvent.click(screen.getByRole('menuitem', { name: '수정' }));
    const input = screen.getByRole<HTMLTextAreaElement>('textbox');
    fireEvent.change(input, { target: { value: '가'.repeat(1001) } });
    fireEvent.click(screen.getByRole('button', { name: '수정' }));
    expect(mocks.update).not.toHaveBeenCalled();
    expect(input.value).toBe('가'.repeat(1001));
    expect(document.activeElement).toBe(input);
    expect(mocks.showToast).toHaveBeenCalledWith({ message: '댓글은 1,000자 이내로 입력해주세요.', type: 'warning' });
  });
});
