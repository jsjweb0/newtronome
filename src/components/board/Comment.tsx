import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { BaseButton } from '../ui/BaseButton';
import { Ellipsis, PenLine, Trash2 } from 'lucide-react';
import { AuthAccess } from '../auth/AuthAccess';
import LikeButton from '../ui/LikeButton';
import ConfirmDialog from '../ui/ConfirmDialog';
import Avatar from '../ui/Avatar';
import type { Comment as CommentData } from '../../features/board/types/comment';
import { CommunityBoardType } from '../../features/board/types/post';
import { useUpdateComment } from '../../features/board/hooks/useUpdateComment';
import { useDeleteComment } from '../../features/board/hooks/useDeleteComment';

interface CommentProps {
  idx: number;
  data: CommentData;
  boardType: CommunityBoardType;
  postId: string;
  openDropdownId: string | null;
  setOpenDropdownId: Dispatch<SetStateAction<string | null>>;
}

export default function Comment({
  idx,
  data,
  boardType,
  postId,
  openDropdownId,
  setOpenDropdownId,
}: CommentProps) {
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();

  const isSaving = updateComment.isPending || deleteComment.isPending;
  const savingRef = useRef(false);

  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState(data.content);

  const editTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const writerName = data.displayName?.trim() || '알 수 없는 사용자';

  const toggleDropdown = (id: string) => {
    setOpenDropdownId((prev) => (prev === id ? null : id));
  };

  const handleEditClick = (id: string) => {
    setOpenDropdownId(null);

    setIsEditing(id); // 수정 모드로 전환
    setEditText(data.content); // 기존 댓글 내용 채우기
  };

  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      editTextareaRef.current.focus();
    }
  }, [isEditing]);

  const handleEditSubmit = async () => {
    const content = editText.trim();

    if (savingRef.current || !content) return;

    savingRef.current = true;

    try {
      await updateComment.mutateAsync({
        boardType,
        postId,
        commentId: data.id,
        content,
      });

      setIsEditing(null);

      const notification = {
        notificationId: Date.now(),
        message: '댓글이 수정되었습니다.',
      };

      showToast({ message: notification.message });
      addNotification(notification);
    } catch {
      const notification = {
        notificationId: Date.now(),
        message: '수정에 실패했습니다.',
      };

      showToast({ message: notification.message, type: 'error' });
      addNotification(notification);
    } finally {
      savingRef.current = false;
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(null); // 수정 모드 종료
    setEditText(''); // 수정된 텍스트 초기화
  };

  const handleDelete = async () => {
    if (savingRef.current) return;

    savingRef.current = true;
    setShowConfirm(false);
    setOpenDropdownId(null);

    try {
      await deleteComment.mutateAsync({
        boardType: data.boardType,
        postId: data.postId,
        commentId: data.id,
      });

      const notification = {
        notificationId: Date.now(),
        message: '댓글이 삭제되었습니다.',
      };

      showToast({ message: notification.message });
      //addNotification(notification);
    } catch {
      const notification = {
        notificationId: Date.now(),
        message: '삭제에 실패했습니다.',
      };

      showToast({ message: notification.message, type: 'error' });
      addNotification(notification);
    } finally {
      savingRef.current = false;
    }
  };

  const createdAt = dayjs(data.createdAt);

  return (
    <li className="flex flex-col gap-1.5 px-1 py-4 border-b border-line">
      <div className="flex items-center justify-between gap-2.5">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
          <Avatar name={writerName} photoURL={data.photoURL} className="size-7 text-xs" />
          <strong className="text-sm font-bold text-textBase">{writerName}</strong>
          <time
            dateTime={createdAt.toISOString()}
            title={createdAt.format('YYYY-MM-DD A hh:mm:ss')}
            className="text-xs text-textSub tabular-nums"
          >
            {createdAt.format('YYYY.MM.DD HH:mm')}
            <span className="ml-1.5">{createdAt.fromNow()}</span>
          </time>
        </p>
        {isEditing !== data.id && (
          <div className="shrink-0 flex items-center">
            <LikeButton
              type="thumb"
              collection={boardType}
              parentId={postId}
              subCollection="comments"
              docId={data.id}
              initialCount={data.likeCount}
              showCount
            />
            <AuthAccess allow={['admin']} ownerUid={data.writerUid}>
              <div className="relative ml-1">
                <button
                  id={'commentMenu' + idx}
                  type="button"
                  className="flex justify-center items-center size-9 rounded-full text-textSub hover:bg-field hover:text-textBase focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
                  onClick={() => toggleDropdown(data.id)}
                  aria-haspopup="menu"
                  aria-expanded={openDropdownId === data.id ? 'true' : 'false'}
                  aria-label="댓글 메뉴 (수정, 삭제)"
                >
                  <Ellipsis className="size-5" aria-hidden="true" />
                </button>

                <div
                  className={`transition-all duration-200 transform origin-top-right z-999 absolute right-0 top-10 w-30 h-fit p-1 rounded-xl border border-textThr bg-background shadow-lg dark:bg-field ${openDropdownId === data.id
                    ? 'opacity-100 visible scale-100'
                    : 'opacity-0 invisible scale-95'
                    }`}
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby={'commentMenu' + idx}
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="flex items-center gap-x-2.5 w-full min-h-10 px-3 rounded-lg text-sm text-textBase hover:bg-textThr/60"
                    onClick={() => handleEditClick(data.id)}
                  >
                    <PenLine aria-hidden="true" className="shrink-0 size-4" />
                    수정
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex items-center gap-x-2.5 w-full min-h-10 px-3 rounded-lg text-sm text-danger hover:bg-textThr/60"
                    onClick={() => setShowConfirm(true)}
                  >
                    <Trash2 aria-hidden="true" className="shrink-0 size-4" />
                    삭제
                  </button>
                </div>
              </div>
            </AuthAccess>
          </div>
        )}
      </div>
      {/* 댓글 내용 수정 폼 */}
      {isEditing === data.id ? (
        <div className="flex flex-col gap-2.5 mt-1 p-3.5 rounded-[14px] border border-primary/60 bg-surface">
          <label htmlFor="comment-edit-input" className="sr-only">작성된 댓글</label>
          <textarea
            id="comment-edit-input"
            rows={3}
            className="resize-y min-h-21 px-0.5 py-1 border-0 bg-transparent text-[15px] leading-relaxed text-textBase placeholder:text-textSub/70 focus:ring-0 disabled:opacity-60"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            disabled={isSaving}
            ref={editTextareaRef}
            placeholder="내용을 입력해주세요."
          />
          <div className="flex justify-end gap-2">
            <BaseButton
              variant="cancel"
              type="button"
              className="min-h-10 px-4.5"
              onClick={handleCancelEdit}
              disabled={isSaving}
            >
              취소
            </BaseButton>
            <BaseButton type="button" className="min-h-10 px-4.5" onClick={handleEditSubmit} disabled={isSaving}>
              {isSaving ? '수정 중...' : '수정'}
            </BaseButton>
          </div>
        </div>
      ) : (
        <p className="text-[15px] leading-[1.7] whitespace-pre-wrap break-words text-textBase/90">
          {data.content}
        </p>
      )}
      <ConfirmDialog
        isOpen={showConfirm}
        title="삭제"
        message="댓글을 삭제하시겠습니까?"
        onConfirm={handleDelete}
        onDismiss={() => setShowConfirm(false)}
      />
    </li>
  );
}
