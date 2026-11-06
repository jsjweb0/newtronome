import { Navigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import MyPostsList from '../../components/board/MyPostsList';
import MyCommentSection from '../../components/board/MyCommentSection';
import { MessageSquareText, NotebookPen } from 'lucide-react';
import { MusicLibrary } from '../../components/icons';
import Avatar from '../../components/ui/Avatar';
import { formatDate } from '../../utils/format';
import type { CommunityBoardType, Post } from '../../features/board/types/post';
import SearchBar from '../../components/board/SearchBar';
import PostListSkeleton from '../../components/board/PostListSkeleton';
import { useMyBoardPosts } from '../../features/board/hooks/useMyBoardPosts';
import { useDeletePost } from '../../features/board/hooks/useDeletePost';
import RetryErrorState from '../../components/ui/RetryErrorState';
import { useMyCommentsQuery } from '../../features/board/hooks/useMyCommentsQuery';

export default function MyActivity() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p role="status" className="mt-10 text-center text-sm text-textSub">로그인 상태를 확인하고 있습니다.</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <MyActivityContent key={user.uid} userId={user.uid} />;
}

function MyActivityContent({ userId }: { userId: string }) {
  const { user } = useAuth();
  const userName = user?.displayName?.trim() || user?.email || '사용자';
  const noticeQuery = useMyBoardPosts(userId, 'notice');
  const freeQuery = useMyBoardPosts(userId, 'free');
  const posts = [
    ...(noticeQuery.data ?? []),
    ...(freeQuery.data ?? []),
  ];

  const hasPostsData = noticeQuery.data !== undefined && freeQuery.data !== undefined;
  const isInitialLoading = !hasPostsData && (noticeQuery.isPending || freeQuery.isPending);
  const hasPostsError = noticeQuery.isError || freeQuery.isError;
  const isInitialError = !hasPostsData && hasPostsError;
  const isBackgroundError = hasPostsData && hasPostsError;
  const isFetchingPosts = noticeQuery.isFetching || freeQuery.isFetching;

  const retryPosts = async () => {
    await Promise.all([
      noticeQuery.refetch(),
      freeQuery.refetch(),
    ]);
  };

  const noticeDelete = useDeletePost('notice');
  const freeDelete = useDeletePost('free');

  const deletePost = async (
    boardType: CommunityBoardType,
    postId: Post['id'],
  ): Promise<void> => {
    if (boardType === 'notice') {
      await noticeDelete.mutateAsync(postId);
    } else {
      await freeDelete.mutateAsync(postId);
    }
  };

  const commentsQuery = useMyCommentsQuery(userId);
  const comments = commentsQuery.data ?? [];

  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = Number.parseInt(searchParams.get('page') ?? '', 10) || 1;
  const keywordParam = searchParams.get('keyword') || '';
  const [postPage, setPostPage] = useState(pageParam);
  const [commentPage, setCommentPage] = useState(pageParam);
  const [searchKeyword, setSearchKeyword] = useState(keywordParam);

  useEffect(() => {
    const p = Number.parseInt(searchParams.get('page') ?? '', 10);
    const kw = searchParams.get('keyword') || '';
    setPostPage(isNaN(p) ? 1 : p);
    setCommentPage(isNaN(p) ? 1 : p);
    setSearchKeyword(kw);
  }, [searchParams]);

  useEffect(() => {
    setSearchParams((previousParams) => {
      const nextParams = new URLSearchParams(previousParams);
      nextParams.set('page', '1');
      nextParams.set('keyword', searchKeyword);
      return nextParams;
    });
  }, [searchKeyword, setSearchParams]);

  const handlePostPageChange = (page: number) => {
    setPostPage(page);
  };

  const handleCommentPageChange = (page: number) => {
    setCommentPage(page);
  };

  const postTotal = hasPostsData ? posts.length : '—';
  const commentTotal = commentsQuery.data !== undefined ? comments.length : '—';

  return (
    <section aria-labelledby="my-activity-title" className="w-full max-w-250 mx-auto flex flex-col gap-4.5 md:gap-5.5 px-1 md:px-7 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3.5">
        <div className="flex items-center gap-3">
          <MusicLibrary aria-hidden="true" className="shrink-0 size-6.5 text-primary" />
          <div>
            <h1 id="my-activity-title" className="text-[28px] leading-tight font-extrabold tracking-tight text-textBase">
              My Activity
            </h1>
            <p className="mt-0.5 text-[13px] text-textSub">내가 쓴 글과 댓글을 모아 봐요</p>
          </div>
        </div>
        {user && (
          <div className="flex items-center gap-2.5">
            <Avatar name={userName} photoURL={user.photoURL} className="size-9 text-sm" />
            <span className="flex flex-col">
              <strong className="text-sm text-textBase">{userName}</strong>
              {user.createdAt && (
                <span className="text-xs text-textSub">가입 {formatDate(user.createdAt)}</span>
              )}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <StatCard icon={<NotebookPen aria-hidden="true" className="size-5.5" />} label="총 게시물" value={postTotal} />
        <StatCard icon={<MessageSquareText aria-hidden="true" className="size-5.5" />} label="총 댓글" value={commentTotal} />
      </div>

      <SearchBar
        variant="wide"
        placeholder="내 글 제목·댓글 내용 검색"
        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}
      />

      <section aria-labelledby="my-posts-title" className="flex flex-col gap-1.5">
        <h2 id="my-posts-title" className="mb-1.5 flex items-baseline gap-2 text-xl font-bold text-textBase">
          나의 게시물
          {hasPostsData && <span className="text-[13px] font-medium text-textSub">{posts.length}개</span>}
        </h2>

        {isInitialLoading ? (
          <div role="status">
            <span className="sr-only">내 게시글을 불러오는 중입니다.</span>
            <PostListSkeleton rows={5} showToolbar={false} />
          </div>
        ) : isInitialError ? (
          <RetryErrorState
            message="내 게시글을 불러오지 못했습니다."
            isRetrying={isFetchingPosts}
            onRetry={() => {
              void retryPosts();
            }}
          />
        ) : (
          <>
            {isBackgroundError && (
              <RetryErrorState
                message="최신 게시글을 불러오지 못했습니다. 이전 목록을 표시합니다."
                isRetrying={isFetchingPosts}
                onRetry={() => {
                  void retryPosts();
                }}
              />
            )}

            <MyPostsList
              currentPage={postPage}
              setCurrentPage={setPostPage}
              searchKeyword={searchKeyword}
              deletePost={deletePost}
              posts={posts}
              handlePageChange={handlePostPageChange}
            />
          </>
        )}
      </section>

      <section aria-labelledby="my-comments-title" className="flex flex-col gap-1.5">
        <h2 id="my-comments-title" className="mb-1.5 flex items-baseline gap-2 text-xl font-bold text-textBase">
          내가 쓴 댓글
          {commentsQuery.data !== undefined && (
            <span className="text-[13px] font-medium text-textSub">{comments.length}개</span>
          )}
        </h2>

        <MyCommentSection
          currentPage={commentPage}
          setCurrentPage={setCommentPage}
          searchKeyword={searchKeyword}
          comments={comments}
          isPending={
            commentsQuery.data === undefined &&
            commentsQuery.isPending
          }
          isError={
            commentsQuery.data === undefined &&
            commentsQuery.isError
          }
          isFetching={commentsQuery.isFetching}
          onRetry={() => {
            void commentsQuery.refetch();
          }}
          handlePageChange={handleCommentPageChange}
        />
      </section>
    </section>
  );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: number | string }) {
  return (
    <div className="flex items-center gap-3 md:gap-3.5 px-3.5 py-4 md:px-5 md:py-4.5 rounded-2xl border border-line bg-surface">
      <span className="shrink-0 flex items-center justify-center size-10 md:size-11.5 rounded-xl bg-primary/12 text-primary">
        {icon}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-[13px] text-textSub">{label}</span>
        <span className="font-inter text-2xl md:text-[26px] font-extrabold leading-tight text-textBase tabular-nums">{value}</span>
      </span>
    </div>
  );
}
