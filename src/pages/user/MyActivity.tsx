import { Navigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import MyPostsList from '../../components/board/MyPostsList';
import MyCommentSection from '../../components/board/MyCommentSection';
import { MessageSquareText, NotebookPen } from 'lucide-react';
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

  return (
    <div className="mb-8 p-4 lg:p-8">
      {/* Card Section */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        {/* Card */}
        <div className="flex flex-col border border-textThr shadow-2xs rounded-xl">
          <div className="p-4 md:p-5 flex gap-x-4">
            <div className="shrink-0 flex justify-center items-center size-11 rounded-lg bg-gray-50 dark:bg-background">
              <NotebookPen className="text-textBase/80" />
            </div>

            <div className="grow">
              <div className="flex items-center gap-x-2">
                <p className="text-xs text-textSub">총 게시물</p>
              </div>
              <div className="mt-1 flex items-center gap-x-2">
                <h3 className="text-xl sm:text-2xl font-medium text-gray-800 dark:text-neutral-200">
                  {hasPostsData ? posts.length : '—'}
                </h3>
              </div>
            </div>
          </div>
        </div>
        {/* End Card */}

        {/* Card */}
        <div className="flex flex-col border border-textThr shadow-2xs rounded-xl">
          <div className="p-4 md:p-5 flex gap-x-4">
            <div className="shrink-0 flex justify-center items-center size-11 rounded-lg bg-gray-50 dark:bg-background">
              <MessageSquareText className="text-textBase/80" />
            </div>

            <div className="grow">
              <div className="flex items-center gap-x-2">
                <p className="text-xs text-textSub">총 댓글</p>
              </div>
              <div className="mt-1 flex items-center gap-x-2">
                <h3 className="text-xl font-medium text-gray-800 dark:text-neutral-200">
                  {commentsQuery.data !== undefined
                    ? comments.length
                    : '—'}
                </h3>
              </div>
            </div>
          </div>
        </div>
        {/* End Card */}
      </div>
      {/* End Card Section */}

      <SearchBar searchKeyword={searchKeyword} setSearchKeyword={setSearchKeyword} />

      <h3 className="mb-4">나의 게시물</h3>

      {isInitialLoading ? (
        <div role="status">
          <span className="sr-only">내 게시글을 불러오는 중입니다.</span>
          <PostListSkeleton />
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

      <h3 className="mb-4">내가 쓴 댓글</h3>

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
    </div>
  );
}
