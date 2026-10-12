import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { useRef, useState } from 'react';
import { BaseButton } from '../ui/BaseButton';
import { useNotifications } from '../../contexts/NotificationContext';
import Comment from './Comment';
import type { SubmitEvent } from 'react';
import RetryErrorState from '../ui/RetryErrorState';
import type { CommunityBoardType } from '../../features/board/types/post';
import { useQueryClient } from '@tanstack/react-query';
import { useCommentsQuery } from '../../features/board/hooks/useCommentsQuery';
import { commentQueryKeys } from '../../features/board/queries/commentQueryKeys';
import { createCommentInFirestore } from '../../features/board/services/commentsService';

dayjs.locale('ko');
dayjs.extend(relativeTime);

interface PostCommentSectionProps {
  boardType: CommunityBoardType;
  postId: string;
  onCommentChange?: (count: number) => void;
}

export default function PostCommentSection({
  boardType,
  postId,
  onCommentChange
}: PostCommentSectionProps) {
  const { user, avatarUrl, nicknameUrl } = useAuth();
  const queryClient = useQueryClient();
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

  const { showToast } = useToast();
  const { addNotification } = useNotifications();


  const [isSubmitting, setIsSubmitting] = useState(false);

  const [comment, setComment] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const submittingRef = useRef(false);

  const profileImage = (): string => {
    if (user?.photoURL) {
      return user.photoURL;
    }
    if (user?.displayName) {
      return nicknameUrl;
    }
    return avatarUrl;
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submittingRef.current) return;

    if (!comment.trim()) {
      textareaRef.current?.focus();
      showToast({ message: '내용을 입력해주세요!', type: 'error' });
      return;
    }

    if (!user) {
      showToast({
        message: '로그인 후 작성할 수 있습니다.',
        type: 'error',
      });
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const notification = { notificationId: Date.now(), message: '댓글이 등록되었습니다.' };

      await createCommentInFirestore(boardType, postId, {
        content: comment.trim(),
        writerUid: user.uid,
        writerEmail: user.email,
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: commentQueryKeys.post(
            boardType,
            postId,
          ),
        }),
        queryClient.invalidateQueries({
          queryKey: commentQueryKeys.mineRoot(),
        }),
      ]);

      setComment('');

      showToast({ message: notification.message });
      addNotification(notification);
    } catch (error) {
      console.error('댓글 등록 실패:', error);
      showToast({ message: '댓글 등록에 실패했습니다.', type: 'error' });
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
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

  {
    isBackgroundError && (
      <RetryErrorState
        message="최신 댓글을 불러오지 못했습니다. 이전 댓글을 표시합니다."
        isRetrying={commentsQuery.isFetching}
        onRetry={() => {
          void commentsQuery.refetch();
        }}
      />
    )
  }

  return (
    <div className="mt-6 md:mt-12">
      <div className="flex items-start gap-2">
        <h3 className="flex gap-1 text-gray-700 font-medium text-sm md:text-base dark:text-neutral-300">
          Comments
        </h3>
        <span className="inline-flex items-center py-1 px-2 rounded-full text-xs font-medium bg-blue-600 text-white">
          {comments.length}
        </span>
      </div>
      {user ? (
        <div className="mt-4">
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <div className="flex gap-2 items-center absolute top-4 left-4.5 text-gray-900 font-medium">
                <img
                  src={profileImage()}
                  alt={user.displayName ?? user.email ?? '사용자 프로필'}
                  className="size-12 rounded-full"
                />
              </div>
              <textarea
                className="resize-none block w-full pt-5 pr-5 pb-12 pl-21 border-gray-200 rounded-lg text-xs md:text-base focus:border-blue-500 focus:ring-blue-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="내용을 입력해주세요."
                ref={textareaRef}
              />
              <div className="absolute bottom-0 right-0 p-2">
                <BaseButton type="submit" className="py-2!" disabled={isSubmitting}>
                  {isSubmitting ? '작성 중...' : '작성'}
                </BaseButton>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="my-5 text-center text-sm md:text-base text-gray-700 dark:text-neutral-500">
          로그인 후 작성 가능합니다.
        </div>
      )}

      {/* 댓글 목록 */}
      <div className="mt-4 mb-14">
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
      </div>
    </div>
  );
}
