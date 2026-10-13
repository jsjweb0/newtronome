import { useEffect, useMemo, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Link } from 'react-router-dom';
import { ThumbsUp } from 'lucide-react';
import { BaseButton } from '../ui/BaseButton';
import { useToast } from '../../contexts/ToastContext';
import Pagination from './Pagination';
import { formatDate } from '../../utils/format';
import { getCurrentPageItems, getTotalPages } from '../../utils/pagination';
import RetryErrorState from '../ui/RetryErrorState';
import type { Comment as CommentData } from '../../features/board/types/comment';
import { useDeleteComment } from '../../features/board/hooks/useDeleteComment';

interface MyCommentSectionProps {
  searchKeyword: string;
  comments: CommentData[];
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  handlePageChange: (page: number) => void;
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  onRetry: () => void;
}

export default function MyCommentSection({
  searchKeyword,
  comments,
  currentPage,
  setCurrentPage,
  handlePageChange,
  isPending,
  isError,
  isFetching,
  onRetry,
}: MyCommentSectionProps) {
  const { showToast } = useToast();

  // 2) 필터 & 정렬
  const filteredComments = useMemo(() => {
    return comments
      .filter((c) => c.content.toLowerCase().includes(searchKeyword.toLowerCase()))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [comments, searchKeyword]);

  const totalItems = filteredComments.length;
  const pageSize = 10;
  const totalPages = getTotalPages(totalItems, pageSize);

  // currentPage가 범위를 벗어나면 조정
  useEffect(() => {
    if (isPending || isError) return;

    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [
    isPending,
    isError,
    totalPages,
    currentPage,
    setCurrentPage,
  ]);

  const currentComments = useMemo(
    () => getCurrentPageItems(filteredComments, currentPage, pageSize),
    [filteredComments, currentPage]
  );

  const deleteComment = useDeleteComment();
  const deletingRef = useRef(false);

  const handleDelete = async (comment: CommentData) => {
    if (deletingRef.current) return;
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    deletingRef.current = true;

    try {
      await deleteComment.mutateAsync({
        boardType: comment.boardType,
        postId: comment.postId,
        commentId: comment.id,
      });

      showToast({ message: '댓글이 삭제되었습니다.' });
    } catch {
      showToast({
        message: '삭제에 실패했습니다.',
        type: 'error',
      });
    } finally {
      deletingRef.current = false;
    }
  };

  if (isPending) {
    return (
      <p
        role="status"
        className="mt-4 text-center text-sm text-textSub"
      >
        댓글을 불러오는 중입니다.
      </p>
    );
  }

  if (isError) {
    return (
      <RetryErrorState
        message="내 댓글을 불러오지 못했습니다."
        isRetrying={isFetching}
        onRetry={onRetry}
      />
    );
  }

  if (!filteredComments.length) {
    return (
      <p role="status" className="mt-4 py-10 text-center text-sm text-textSub">
        작성한 댓글이 없습니다.
      </p>
    );
  }

  return (
    <>
      <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden text-gray-500 text-xs md:text-base text-left md:text-center dark:border-neutral-700 dark:text-neutral-400">
        {currentComments.map((c, idx) => (
          <li
            key={c.id}
            className="grid grid-cols-1 md:grid-cols-12 md:gap-2 px-4 py-3 text-xs md:text-base sm:items-center hover:bg-gray-50 dark:hover:bg-neutral-800 dark:border-neutral-700"
          >
            <div>{(currentPage - 1) * pageSize + idx + 1}</div>
            <div className="md:col-span-1">
              {c.boardType === 'free'
                ? '자유게시판'
                : c.boardType === 'notice'
                  ? '공지사항'
                  : c.boardType}
            </div>
            <Link
              to={`/board/${c.boardType}/${c.postId}`}
              className="flex items-start gap-2 md:col-span-6 text-left max-w-full py-2 font-medium text-gray-900 dark:text-white"
            >
              {c.content}
            </Link>
            <div className="md:col-span-2">{formatDate(c.createdAt, true)}</div>
            <div className="flex items-center gap-2">
              <ThumbsUp className={`shrink-0 size-4 fill-blue-600 stroke-blue-600 text-blue-600`} />
              {c.likeCount ?? 0}
            </div>
            <div className="max-md:mt-2">
              <BaseButton
                variant="cancel"
                className="px-3! py-1!"
                onClick={() => handleDelete(c)}
                disabled={deleteComment.isPending}
              >
                삭제
              </BaseButton>
            </div>
          </li>
        ))}
      </ul>

      {/* 페이징 */}
      <Pagination
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </>
  );
}
