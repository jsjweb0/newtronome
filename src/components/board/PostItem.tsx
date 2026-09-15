import { Link } from 'react-router-dom';
import { AuthAccess } from '../auth/AuthAccess';
import { useToast } from '../../contexts/ToastContext';
import { getCommentCountFromDB } from '../../utils/comment';
import { BaseButton } from '../ui/BaseButton';
import { useEffect, useState } from 'react';
import { formatDate } from '../../utils/format';
import { useNotifications } from '../../contexts/NotificationContext';
import type { Dispatch, SetStateAction } from 'react';
import type {
  CommunityBoardType,
  Post,
} from '../../contexts/PostsContext';
import { FREE_BOARD_CATEGORY_LABELS } from '../../constants/freeBoardCategories';

type PostItemProps = {
  post: Post;
  searchKeyword: string;
  setPosts: Dispatch<SetStateAction<Post[]>>;
  boardType: CommunityBoardType;
  currentPage: number;
  dateSort: boolean;
  deletePost: (postId: Post['id']) => Promise<void>;
}

function PostItem({ post, searchKeyword, setPosts, boardType, currentPage, dateSort, deletePost
}: PostItemProps) {
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    getCommentCountFromDB(boardType, post.id)
      .then((count) => {
        if (mounted) setCommentCount(count);
      })
      .catch(() => {
        if (mounted) setCommentCount(0);
      });
    return () => {
      mounted = false;
    };
  }, [boardType, post.id]);

  const categoryColorMap: Record<string, string> = {
    chat: 'text-blue-500 font-normal',
    quote: 'text-orange-400 font-normal',
    recommendation: 'text-gray-400 font-normal',
    question: 'text-pink-300 font-normal',
  };

  const categoryLabel = post.category
    ? FREE_BOARD_CATEGORY_LABELS[post.category] ?? post.category
    : null;

  const displayAuthor =
    boardType === 'notice'
      ? '관리자'
      : post.displayName ?? post.email ?? '알 수 없음';

  const highlightText = (text: string, keyword: string) => {
    if (!keyword) return text;

    const regex = new RegExp(`(${keyword})`, 'gi');

    return text.split(regex).map((part, index) =>
      part.toLowerCase() === keyword.toLowerCase() ? (
        <mark key={index}>{part}</mark>
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

      setPosts((previousPosts) =>
        previousPosts.filter((post) => post.id !== targetId)
      );

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-13 gap-2 px-4 py-3 text-xs md:text-base sm:items-center hover:bg-gray-50 dark:hover:bg-neutral-800 dark:border-neutral-700">
      <div>
        {post.isNotice ? (
          <span className="shrink-0 inline-block px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-full">
            📌 공지
          </span>
        ) : (
          <span>{Number.isFinite(post.postNo) ? post.postNo : '번호없음'}</span>
        )}
      </div>
      <div className="flex items-start md:items-center flex-col md:flex-row gap-2 md:col-span-7 text-left">
        <Link
          to={`/board/${boardType}/${post.id}?page=${currentPage}&keyword=${searchKeyword}&sort=${dateSort ? 'asc' : 'desc'}`}
          className="overflow-hidden inline-flex items-center max-w-full py-2 font-medium text-gray-900 dark:text-white"
          state={{
            page: currentPage,
            sort: dateSort,
            keyword: searchKeyword,
          }}
        >
          {post.category && categoryLabel && (
            <span
              className={`shrink-0 inline-block ${categoryColorMap[post.category] || 'text-gray-500'
                } mr-2`}
            >
              [{categoryLabel}]
            </span>
          )}

          <span className="inline-block truncate">{highlightText(post.title, searchKeyword)}</span>

          {commentCount > 0 && (
            <i className="shrink-0 inline-block not-italic text-xs text-gray-500 px-2">
              {commentCount}
            </i>
          )}
        </Link>
        <AuthAccess allow={['admin']}>
          <div className="shrink-0 flex justify-start md:justify-center items-center gap-1">
            <BaseButton
              as="link"
              to={`/board/${boardType}/edit/${post.id}`}
              className="px-3! py-2! md:text-sm"
              variant="cancel"
            >
              수정
            </BaseButton>
            <BaseButton
              variant="cancel"
              className="px-3! py-2! md:text-sm"
              onClick={() => {
                deletePosts(post.id);
              }}
            >
              삭제
            </BaseButton>
          </div>
        </AuthAccess>
      </div>
      <div className="md:col-span-2">{displayAuthor}</div>
      <div>{Number.isFinite(post.viewCount) ? post.viewCount : 0}</div>
      <div className="md:col-span-2">{formatDate(post.date)}</div>
    </div>
  );
}

export default PostItem;