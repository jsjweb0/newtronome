import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { useNotifications } from '../../contexts/NotificationContext';
import {
  isCommunityBoardType,
  type CommunityBoardType,
  type Post,
} from '../../features/board/types/post';
import { useEffect, useMemo, useRef } from 'react';
import { AuthAccess } from '../../components/auth/AuthAccess';
import clsx from 'clsx';
import {
  AlignJustify,
  ChevronLeft,
  ChevronRight,
  SquarePen,
  Trash2,
} from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
import LikeButton from '../../components/ui/LikeButton';
import PostCommentSection from '../../components/board/PostCommentSection';
import ShareButton from '../../components/board/ShareButton';
import PostViewSkeleton from './PostViewSkeleton';
import { formatDate } from '../../utils/format';
import {
  FREE_BOARD_CATEGORY_LABELS,
  getFreeBoardCategoryBadgeClass,
  isFreeBoardCategoryValue,
} from '../../constants/freeBoardCategories';
import { normalizeLegacyPostContent } from '../../utils/postContent';
import { createBoardListSearch } from '../../features/board/utils/boardListSearch';
import { useDeletePost } from '../../features/board/hooks/useDeletePost';
import { useBoardPost } from '../../features/board/hooks/useBoardPost';
import { useBoardPosts } from '../../features/board/hooks/useBoardPosts';
import { useIncrementPostViewCount } from '../../features/board/hooks/useIncrementPostViewCount';
import RetryErrorState from '../../components/ui/RetryErrorState';
import { useAuth } from '../../contexts/AuthContext';
import { useCommentsQuery } from '../../features/board/hooks/useCommentsQuery';
import { filterAndSortBoardPosts } from '../../features/board/utils/filterAndSortBoardPosts';
import { DEFAULT_ITEMS_PER_PAGE } from '../../utils/pagination';

export default function PostView() {
  const { boardType, id } = useParams();

  if (!id || !isCommunityBoardType(boardType)) {
    return <div className="text-center mt-10 font-bold">존재하지 않는 게시판입니다.</div>;
  }

  return <PostViewContent boardType={boardType} postId={id} />;
}

function PostViewContent({ boardType, postId }: {
  boardType: CommunityBoardType;
  postId: Post['id'];
}) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const { mutateAsync: deletePost, isPending: isDeleting } = useDeletePost(boardType);
  const deletingRef = useRef(false);
  const location = useLocation();
  const activeLocationKeyRef = useRef<string | null>(location.key);

  useEffect(() => {
    activeLocationKeyRef.current = location.key;
    return () => { activeLocationKeyRef.current = null; };
  }, [location.key]);
  const countedEntryRef = useRef<string | null>(null);
  const {
    data: currentPost,
    isPending: loading,
    isError,
    isFetching,
    refetch,
  } = useBoardPost(boardType, postId);
  const postsQuery = useBoardPosts(boardType);

  const { mutateAsync: incrementViewCount } = useIncrementPostViewCount();

  const commentsQuery = useCommentsQuery(
    boardType,
    postId,
    user?.uid,
  );

  const commentCount = commentsQuery.data?.length;

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const pageFromQuery = Number.parseInt(searchParams.get('page') ?? '', 10);
  const page = Number.isSafeInteger(pageFromQuery) && pageFromQuery > 0 ? pageFromQuery : 1;
  const keyword = searchParams.get('keyword') ?? '';
  const category = searchParams.get('category') ?? '';
  const sort = searchParams.get('sort') === 'asc' ? 'asc' : 'desc';
  const selectedCategory =
    boardType === 'free' && isFreeBoardCategoryValue(category)
      ? category
      : '';

  const boardSearch = createBoardListSearch({
    page,
    keyword,
    category,
    sort,
  });

  const navigationPosts = useMemo(
    () =>
      filterAndSortBoardPosts(postsQuery.data ?? [], {
        keyword,
        category: selectedCategory,
        sort,
      }),
    [postsQuery.data, keyword, selectedCategory, sort],
  );

  const currentIndex = navigationPosts.findIndex(
    (post) => String(post.id) === postId,
  );

  const prevIndex = currentIndex - 1;
  const nextIndex = currentIndex + 1;

  const prevPost = prevIndex >= 0 ? navigationPosts[prevIndex] : undefined;

  const nextPost =
    currentIndex >= 0 && nextIndex < navigationPosts.length
      ? navigationPosts[nextIndex]
      : undefined;

  const getPageByIndex = (index: number) =>
    Math.floor(index / DEFAULT_ITEMS_PER_PAGE) + 1;

  const prevSearch =
    prevPost &&
    createBoardListSearch({
      page: getPageByIndex(prevIndex),
      keyword,
      category: selectedCategory,
      sort,
    });

  const nextSearch =
    nextPost &&
    createBoardListSearch({
      page: getPageByIndex(nextIndex),
      keyword,
      category: selectedCategory,
      sort,
    });

  useEffect(() => {
    const entryKey = `${location.key}:${boardType}/${postId}`;

    if (
      !currentPost ||
      countedEntryRef.current === entryKey
    ) {
      return;
    }

    countedEntryRef.current = entryKey;

    void incrementViewCount({ boardType, postId }).catch((error: unknown) => {
      console.error('조회수 기록 실패:', error);
    });
  }, [boardType, postId, location.key, currentPost, incrementViewCount]);

  if (loading) {
    return (
      <div role="status">
        <span className="sr-only">게시글을 불러오는 중입니다.</span>
        <PostViewSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <RetryErrorState
        message="게시글을 불러오지 못했습니다."
        isRetrying={isFetching}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }
  if (!currentPost)
    return <p role="status" className="mt-10 text-center text-sm text-textSub">존재하지 않는 게시글입니다.</p>;

  const categoryLabel = currentPost.category
    ? FREE_BOARD_CATEGORY_LABELS[currentPost.category] ?? currentPost.category
    : null;

  const deletePosts = async (postId: Post['id']) => {
    if (deletingRef.current) return;
    if (!window.confirm('삭제하시겠습니까?')) return;
    deletingRef.current = true;
    const startedLocationKey = location.key;

    const id = Date.now();
    const notification = { id, message: '게시글이 삭제되었습니다.' };
    const notificationErr = { id, message: '삭제에 실패했습니다.' };

    try {
      await deletePost(postId);
      showToast({ message: notification.message });
      addNotification(notification);

      if (activeLocationKeyRef.current === startedLocationKey) {
        navigate(`/board/${boardType}${boardSearch}`);
      }
    } catch (err) {
      console.error(err);
      showToast({ message: notificationErr.message });
      addNotification(notificationErr);
    } finally {
      deletingRef.current = false;
    }
  };

  const boardTitle = boardType === 'notice' ? 'Notice' : 'Free Board';
  const authorName = boardType === 'notice'
    ? '관리자'
    : currentPost.displayName?.trim() || '알 수 없는 사용자';
  const pagerLinkClasses =
    'min-w-0 flex flex-col justify-center gap-0.5 min-h-15 px-3.5 py-2 rounded-xl bg-surface hover:bg-field focus-visible:outline-2 focus-visible:outline-primary';

  return (
    <section aria-label="게시글" className="w-full max-w-225 mx-auto flex flex-col gap-4 md:gap-5 px-1 md:px-7 pb-6">
      <Link
        to={`/board/${boardType}${boardSearch}`}
        className="self-start inline-flex items-center gap-1 min-h-11 pr-2 text-sm text-textSub hover:text-textBase"
      >
        <ChevronLeft aria-hidden="true" className="size-4.5" />
        {boardTitle}
      </Link>

      <article
        aria-labelledby="post-title"
        className="rounded-2xl border border-line bg-surface px-4 pt-5 pb-4.5 md:px-8 md:pt-7 md:pb-6"
      >
        <header className="flex flex-col gap-3 pb-4.5 border-b border-textThr/70">
          {categoryLabel && (
            <span className={clsx('self-start px-2.5 py-0.75 rounded-md text-xs font-bold', getFreeBoardCategoryBadgeClass(currentPost.category))}>
              {categoryLabel}
            </span>
          )}
          <h1 id="post-title" className="text-[22px] md:text-[28px] font-extrabold leading-snug tracking-tight text-textBase break-words">
            {currentPost.title}
          </h1>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-textSub">
              <span className="inline-flex items-center gap-2">
                <Avatar
                  name={authorName}
                  photoURL={boardType === 'notice' ? null : currentPost.photoURL}
                  className="size-7.5 text-[13px]"
                />
                <strong className="font-bold text-textBase">{authorName}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>{formatDate(currentPost.date)}</span>
              <span aria-hidden="true">·</span>
              <span>조회 {currentPost.viewCount}</span>
              <span aria-hidden="true">·</span>
              <span>댓글 {commentCount ?? '—'}</span>
              {currentPost.updatedAt && (
                <span className="text-textSub/80">(수정 {formatDate(currentPost.updatedAt, true)})</span>
              )}
            </p>
            <AuthAccess allow={['admin']} ownerUid={currentPost.authorUid}>
              <div role="group" aria-label="게시글 관리" className="flex gap-0.5">
                <Link
                  to={`/board/${boardType}/edit/${currentPost.id}${boardSearch}`}
                  className="inline-flex items-center gap-1 min-h-9 px-2.5 rounded-lg text-[13px] text-textSub hover:bg-field hover:text-textBase"
                >
                  <SquarePen aria-hidden="true" className="size-3.5" />
                  수정
                </Link>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    deletePosts(currentPost.id);
                  }}
                  className="inline-flex items-center gap-1 min-h-9 px-2.5 rounded-lg text-[13px] text-danger hover:bg-field disabled:opacity-50"
                >
                  <Trash2 aria-hidden="true" className="size-3.5" />
                  삭제
                </button>
              </div>
            </AuthAccess>
          </div>
        </header>

        <pre className="py-6.5 pb-7.5 whitespace-pre-wrap break-words font-sans text-[15px] md:text-base leading-[1.85] text-textBase/90">
          {normalizeLegacyPostContent(currentPost.content)}
        </pre>

        <footer className="flex justify-center gap-2.5 pt-5 border-t border-textThr/70">
          <span className="inline-flex items-center min-h-11 pl-2 pr-4.5 rounded-full border border-textThr text-sm font-bold text-textBase">
            <LikeButton
              docId={currentPost.id}
              collection={boardType}
              initialCount={currentPost.likeCount}
              className="min-h-10 min-w-10 justify-center rounded-full hover:text-textBase"
              svgClassName="size-4.5"
            />
          </span>
          <ShareButton />
        </footer>
      </article>

      <nav aria-label="게시글 이동" className="grid grid-cols-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2.5">
        {prevPost ? (
          <Link
            to={`/board/${boardType}/${prevPost.id}${prevSearch}`}
            className={pagerLinkClasses}
          >
            <span className="flex items-center gap-0.5 text-xs text-textSub">
              <ChevronLeft aria-hidden="true" className="size-3.5" />
              이전글
            </span>
            <span className="truncate text-sm text-textBase">{prevPost.title}</span>
          </Link>
        ) : (
          <p className={clsx(pagerLinkClasses, 'text-sm text-textSub hover:bg-surface')}>이전글이 없습니다.</p>
        )}
        <button
          type="button"
          onClick={() => {
            navigate(`/board/${boardType}${boardSearch}`);
          }}
          className="max-md:order-3 max-md:col-span-2 flex items-center justify-center gap-1.5 min-h-15 px-5 rounded-xl bg-surface text-sm font-bold text-textBase hover:bg-field focus-visible:outline-2 focus-visible:outline-primary"
        >
          <AlignJustify aria-hidden="true" className="size-4" />
          목록
        </button>
        {nextPost ? (
          <Link
            to={`/board/${boardType}/${nextPost.id}${nextSearch}`}
            className={clsx(pagerLinkClasses, 'items-end text-right')}
          >
            <span className="flex items-center gap-0.5 text-xs text-textSub">
              다음글
              <ChevronRight aria-hidden="true" className="size-3.5" />
            </span>
            <span className="max-w-full truncate text-sm text-textBase">{nextPost.title}</span>
          </Link>
        ) : (
          <p className={clsx(pagerLinkClasses, 'items-end text-right text-sm text-textSub hover:bg-surface')}>다음글이 없습니다.</p>
        )}
      </nav>

      <PostCommentSection
        boardType={boardType}
        postId={currentPost.id}
      />
    </section>
  );
}
