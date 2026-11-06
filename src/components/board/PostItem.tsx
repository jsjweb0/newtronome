import { Link } from 'react-router-dom';
import { AuthAccess } from '../auth/AuthAccess';
import { useToast } from '../../contexts/ToastContext';
import clsx from 'clsx';
import { MessageSquare, Pin } from 'lucide-react';
import { formatDate } from '../../utils/format';
import { useNotifications } from '../../contexts/NotificationContext';
import type { CommunityBoardType, Post } from '../../features/board/types/post';
import {
  FREE_BOARD_CATEGORY_LABELS,
  getFreeBoardCategoryBadgeClass,
} from '../../constants/freeBoardCategories';
import { createBoardListSearch } from '../../features/board/utils/boardListSearch';
import { useCommentCountQuery } from '../../features/board/hooks/useCommentCountQuery';

type PostItemProps = {
  post: Post;
  searchKeyword: string;
  boardType: CommunityBoardType;
  currentPage: number;
  selectedCategory: string;
  dateSort: boolean;
  deletePost: (postId: Post['id']) => Promise<void>;
}

function PostItem({
  post,
  searchKeyword,
  boardType,
  currentPage,
  selectedCategory,
  dateSort,
  deletePost
}: PostItemProps) {
  const { showToast } = useToast();
  const { addNotification } = useNotifications();

  const sort = dateSort ? 'asc' : 'desc';
  const boardSearch = createBoardListSearch({
    page: currentPage,
    keyword: searchKeyword,
    category: selectedCategory,
    sort,
  });

  const commentCountQuery = useCommentCountQuery(boardType, post.id);
  const commentCount = commentCountQuery.data;

  const categoryLabel = post.category
    ? FREE_BOARD_CATEGORY_LABELS[post.category] ?? post.category
    : null;

  const displayAuthor =
    boardType === 'notice'
      ? '관리자'
      : post.displayName?.trim() || '알 수 없는 사용자';

  const escapeRegExp = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const highlightText = (text: string, keyword: string) => {
    if (!keyword) return text;

    const escapedKeyword = escapeRegExp(keyword);
    const regex = new RegExp(`(${escapedKeyword})`, 'gi');

    return text.split(regex).map((part, index) =>
      part.toLowerCase() === keyword.toLowerCase() ? (
        <mark key={index} className="rounded-sm bg-primary/25 text-inherit">{part}</mark>
      ) : (
        <span key={index}>{part}</span>
      )
    );
  };

  const deletePosts = async (
    targetId: Post['id']
  ): Promise<void> => {
    if (!window.confirm('삭제하시겠습니까?')) return;

    const notification = {
      id: Date.now(),
      message: '삭제에 실패했습니다.',
      type: 'error' as const
    };

    try {
      await deletePost(targetId);

      showToast({
        message: '게시글이 삭제되었습니다.',
        type: 'success',
      });
    } catch (err) {
      console.error(err);

      showToast({
        message: notification.message,
        type: 'error'
      });

      addNotification(notification);
    }
  };

  const viewCount = Number.isFinite(post.viewCount) ? post.viewCount : 0;
  const postDate = formatDate(post.date);

  return (
    <div
      role="row"
      className={clsx(
        'grid grid-cols-1 md:grid-cols-[64px_minmax(0,1fr)_150px_96px_64px] items-center gap-x-4 px-1.5 py-3 md:px-4 md:py-0 md:min-h-15 border-b border-line hover:bg-field/60',
        post.isNotice && 'bg-primary/5'
      )}
    >
      <span role="cell" className="max-md:hidden flex justify-center font-inter text-[13px] text-textSub tabular-nums">
        {post.isNotice ? (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.75 rounded-full bg-primary/12 text-primary font-sans text-[11px] font-bold">
            <Pin aria-hidden="true" className="size-3" />
            공지
          </span>
        ) : (
          /^[1-9]\d*$/.test(post.id) ? post.id : '번호없음'
        )}
      </span>
      <span role="cell" className="min-w-0 flex flex-col gap-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
          <Link
            to={`/board/${boardType}/${post.id}${boardSearch}`}
            className="flex flex-1 items-center gap-2 min-w-0 min-h-7 text-textBase hover:text-primary focus-visible:outline-2 focus-visible:outline-primary rounded"
          >
            {post.isNotice && (
              <span className="md:hidden shrink-0 px-2 py-0.5 rounded-md bg-primary/12 text-primary text-[11px] font-bold">공지</span>
            )}
            {post.category && categoryLabel && (
              <span data-title-part className={clsx('shrink-0 px-2 py-0.5 rounded-md text-[11px] font-bold', getFreeBoardCategoryBadgeClass(post.category))}>
                {categoryLabel}
              </span>
            )}

            <span data-title-part className={clsx('min-w-0 truncate text-[15px]', post.isNotice ? 'font-bold' : 'font-medium')}>
              {highlightText(post.title, searchKeyword)}
            </span>

            {commentCount !== undefined && commentCount > 0 && (
              <span className="shrink-0 inline-flex items-center gap-0.75 text-xs font-bold text-primary">
                <MessageSquare aria-hidden="true" className="size-3.5" />
                <span className="sr-only">댓글</span>
                {commentCount}
                <span className="sr-only">개</span>
              </span>
            )}

            {commentCount === undefined && (
              <span className="shrink-0 text-xs text-textSub">
                <i aria-hidden="true" className="not-italic">—</i>
                <i className="sr-only">
                  {commentCountQuery.isError
                    ? '댓글 수를 불러오지 못했습니다.'
                    : '댓글 수를 불러오는 중입니다.'}
                </i>
              </span>
            )}
          </Link>
          <AuthAccess allow={['admin']}>
            <span className="shrink-0 flex items-center">
              <Link
                to={`/board/${boardType}/edit/${post.id}${boardSearch}`}
                className="inline-flex items-center min-h-9 px-2.5 rounded-lg text-[13px] text-textSub hover:bg-field hover:text-textBase"
              >
                수정
              </Link>
              <button
                type="button"
                className="inline-flex items-center min-h-9 px-2.5 rounded-lg text-[13px] text-danger hover:bg-field"
                onClick={() => {
                  deletePosts(post.id);
                }}
              >
                삭제
              </button>
            </span>
          </AuthAccess>
        </span>
        <span className="md:hidden text-xs text-textSub">
          {displayAuthor} · {postDate} · 조회 {viewCount}
        </span>
      </span>
      <span role="cell" className="max-md:hidden min-w-0 truncate text-[13px] text-textSub">{displayAuthor}</span>
      <span role="cell" className="max-md:hidden text-center text-[13px] text-textSub tabular-nums">{postDate}</span>
      <span role="cell" className="max-md:hidden text-right text-[13px] text-textSub tabular-nums">{viewCount}</span>
    </div>
  );
}

export default PostItem;
