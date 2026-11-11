import { useRef, useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { BaseButton } from '../ui/BaseButton';
import { useNotifications } from '../../contexts/NotificationContext';
import Comment from './Comment';
import type { SubmitEvent } from 'react';
import RetryErrorState from '../ui/RetryErrorState';
import type { CommunityBoardType } from '../../features/board/types/post';
import { useCommentsQuery } from '../../features/board/hooks/useCommentsQuery';
import { useCreateComment } from '../../features/board/hooks/useCreateComment';
import { MessageCircle } from 'lucide-react';

dayjs.locale('ko');
dayjs.extend(relativeTime);

interface PostCommentSectionProps {
  boardType: CommunityBoardType;
  postId: string;
}

export default function PostCommentSection({
  boardType,
  postId,
}: PostCommentSectionProps) {
  const { user } = useAuth();

  const commentsQuery = useCommentsQuery(
    boardType,
    postId,
    user?.uid,
  );

  const comments = commentsQuery.data ?? [];
  const hasCommentsData = commentsQuery.data !== undefined;
  const isInitialLoading = !hasCommentsData && commentsQuery.isPending;
  const isInitialError = !hasCommentsData && commentsQuery.isError;
  const isBackgroundError = hasCommentsData && commentsQuery.isError;

  const createComment = useCreateComment();
  const isSubmitting = createComment.isPending;

  const { showToast } = useToast();
  const { addNotification } = useNotifications();

  const [comment, setComment] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const submittingRef = useRef(false);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (submittingRef.current) return;

    const content = comment.trim();

    if (!content) {
      textareaRef.current?.focus();
      showToast({ message: '내용을 입력해주세요!', type: 'warning' });
      return;
    }

    if (!user) {
      showToast({
        message: '로그인 후 작성할 수 있습니다.',
        type: 'error',
        action: { label: '로그인', to: '/login' },
      });
      return;
    }

    submittingRef.current = true;

    try {
      await createComment.mutateAsync({
        boardType,
        postId,
        input: {
          content,
          writerUid: user.uid,
          displayName: user.displayName || null,
          photoURL: user.photoURL || null,
        },
      });

      setComment('');

      const notification = { notificationId: Date.now(), message: '댓글이 등록되었습니다.' };

      showToast({ message: notification.message });
      addNotification(notification);
    } catch {
      showToast({ message: '댓글 등록에 실패했습니다.', type: 'error' });
    } finally {
      submittingRef.current = false;
    }
  };

  if (isInitialLoading) {
    return <p role="status" className="my-4 text-center text-sm text-textSub">댓글을 불러오는 중입니다.</p>;
  }

  if (isInitialError) {
    return (
      <RetryErrorState
        message="댓글을 불러오지 못했습니다."
        isRetrying={commentsQuery.isFetching}
        onRetry={() => {
          void commentsQuery.refetch();
        }}
      />
    );
  }
  return (
    <section aria-labelledby="comments-title" className="flex flex-col gap-4 pt-2">
      {isBackgroundError && (
        <RetryErrorState
          message="최신 댓글을 불러오지 못했습니다. 이전 댓글을 표시합니다."
          isRetrying={commentsQuery.isFetching}
          onRetry={() => {
            void commentsQuery.refetch();
          }}
        />
      )}

      <h2 id="comments-title" className="flex items-center gap-2 text-xl font-bold text-textBase">
        <MessageCircle aria-hidden="true" className="size-5 text-primary" />
        댓글 <span className="text-primary">{comments.length}</span>
      </h2>
      {user ? (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-2.5 p-3.5 rounded-[14px] border border-line bg-surface focus-within:border-primary/60"
        >
          <label htmlFor="comment-input" className="sr-only">댓글</label>
          <textarea
            id="comment-input"
            rows={3}
            className="resize-y min-h-21 px-0.5 py-1 border-0 bg-transparent text-[15px] leading-relaxed text-textBase placeholder:text-textSub/70 focus:ring-0 disabled:opacity-60"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={isSubmitting}
            ref={textareaRef}
            placeholder="내용을 입력해주세요."
          />
          <div className="flex justify-end">
            <BaseButton type="submit" disabled={isSubmitting} className="min-h-10 px-4.5">
              {isSubmitting ? '등록 중...' : '등록'}
            </BaseButton>
          </div>
        </form>
      ) : (
        <p className="py-5 rounded-[14px] border border-line bg-surface text-center text-sm text-textSub">
          로그인 후 작성 가능합니다.
        </p>
      )}

      {/* 댓글 목록 */}
      <ul className="flex flex-col mb-6">
        {comments.map((commentData, idx) => (
          <Comment
            key={commentData.id}
            idx={idx}
            data={commentData}
            boardType={boardType}
            postId={postId}
            openDropdownId={openDropdownId}
            setOpenDropdownId={setOpenDropdownId}
          />
        ))}
      </ul>
    </section>
  );
}
