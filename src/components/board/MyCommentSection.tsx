import { useEffect, useMemo, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Link } from 'react-router-dom';
import { ThumbsUp, FileX2, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { getBoardBadge } from './boardBadge';
import { useToast } from '../../contexts/ToastContext';
import Pagination from './Pagination';
import { formatDate } from '../../utils/format';
import { getCurrentPageItems, getTotalPages } from '../../utils/pagination';
import RetryErrorState from '../ui/RetryErrorState';
import type { MyComment } from '../../features/board/types/comment';
import { useDeleteComment } from '../../features/board/hooks/useDeleteComment';

interface MyCommentSectionProps {
  searchKeyword: string;
  comments: MyComment[];
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

  const handleDelete = async (comment: MyComment) => {
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
        className="py-8 text-center text-sm text-textSub border-t border-textThr"
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
      <p role="status" className="py-8 text-center text-sm text-textSub border-t border-textThr">
        작성한 댓글이 없습니다.
      </p>
    );
  }

  return (
    <>
      <ul className="border-t border-textThr">
        {currentComments.map((comment) => {
          const badge = getBoardBadge(comment.boardType);

          return (
            <li
              key={comment.id}
              className="flex flex-col gap-1.5 px-1.5 md:px-2.5 py-3.5 border-b border-line hover:bg-field/60"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={clsx('shrink-0 px-2 py-0.5 rounded-md text-[11px] font-bold whitespace-nowrap', badge.className)}>
                      {badge.label}
                    </span>
                    {!comment.postExists && (
                      <span className="inline-flex items-center gap-1 text-[13px] italic text-textSub">
                        <FileX2 aria-hidden="true" className="size-3.5" />
                        원본 삭제됨
                      </span>
                    )}
                  </div>
                  {comment.postExists ? (
                    <Link
                      to={`/board/${comment.boardType}/${comment.postId}`}
                      className="line-clamp-2 text-[15px] leading-relaxed text-textBase hover:text-primary"
                    >
                      {comment.content}
                    </Link>
                  ) : (
                    <p className="line-clamp-2 text-[15px] leading-relaxed text-textBase/80">
                      {comment.content}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="댓글 삭제"
                  className="shrink-0 flex items-center justify-center size-10 md:size-11 rounded-[10px] text-textSub hover:bg-field hover:text-danger focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
                  onClick={() => handleDelete(comment)}
                  disabled={deleteComment.isPending}
                >
                  <Trash2 aria-hidden="true" className="size-4.5" />
                </button>
              </div>
              <div className="flex items-center gap-3 text-xs text-textSub tabular-nums">
                <span>{formatDate(comment.createdAt, true)}</span>
                <span className="inline-flex items-center gap-1">
                  <ThumbsUp aria-hidden="true" className="size-3.5" />
                  <span className="sr-only">좋아요</span>
                  {comment.likeCount ?? 0}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <Pagination
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        label="댓글 페이지"
      />
    </>
  );
}
