import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import MyPostsList from '../../components/board/MyPostsList';
import MyCommentSection from '../../components/board/MyCommentSection';
import { MessageSquareText, NotebookPen } from 'lucide-react';
import { usePosts } from '../../contexts/PostsContext';
import type { CommunityBoardType, Post } from '../../contexts/PostsContext';
import type { Comment as CommentData } from '../../utils/comment';
import SearchBar from '../../components/board/SearchBar';
import PostListSkeleton from '../../components/board/PostListSkeleton';

const BOARD_TYPES: CommunityBoardType[] = ['notice', 'free'];

export default function MyActivity() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const userUid = user?.uid;
  const { getMyPosts, deletePost } = usePosts();

  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState('');
  const [postsRetryCount, setPostsRetryCount] = useState(0);
  // URL 쿼리 & 로컬 상태
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = Number.parseInt(searchParams.get('page') ?? '', 10) || 1;
  const keywordParam = searchParams.get('keyword') || '';
  const [postPage, setPostPage] = useState(pageParam);
  const [commentPage, setCommentPage] = useState(pageParam);
  const [searchKeyword, setSearchKeyword] = useState(keywordParam);

  // 1. 각각의 페이지 번호를 관리할 state
  useEffect(() => {
    if (loading) return;
    if (!userUid) {
      void navigate('/login', { replace: true });
    }
  }, [loading, userUid, navigate]);

  // 1) “내 글” 로드
  useEffect(() => {
    if (loading) return;
    if (!userUid) {
      setPosts([]);
      setLoadingPosts(false);
      return;
    }

    let ignore = false;
    setPosts([]);

    const fetchMyPosts = async () => {
      setLoadingPosts(true);
      setPostsError('');

      try {
        const result = await Promise.all(BOARD_TYPES.map((type) => getMyPosts(type)));
        if (!ignore) setPosts(result.flat());
      } catch (error) {
        if (!ignore) {
          console.error('내 게시글 조회 실패:', error);
          setPostsError('내 게시글을 불러오지 못했습니다.');
        }
      } finally {
        if (!ignore) setLoadingPosts(false);
      }
    };

    void fetchMyPosts();
    return () => {
      ignore = true;
    };
  }, [loading, userUid, getMyPosts, postsRetryCount]);

  // 2) URL → state 동기화
  useEffect(() => {
    const p = Number.parseInt(searchParams.get('page') ?? '', 10);
    const kw = searchParams.get('keyword') || '';
    setPostPage(isNaN(p) ? 1 : p);
    setCommentPage(isNaN(p) ? 1 : p);
    setSearchKeyword(kw);
  }, [searchParams]);

  // 5) 검색어 변경 시 URL 리셋
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
    // URL 동기화도 따로 해주려면 searchParams.set('postPage', page)…
  };

  const handleCommentPageChange = (page: number) => {
    setCommentPage(page);
    // searchParams.set('commentPage', page)
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
                  {posts.length}
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
                  {comments.length}
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
      {loadingPosts ? (
        <PostListSkeleton />
      ) : postsError ? (
        <div className="mb-8 p-4 text-center" role="alert">
          <p>{postsError}</p>
          <button type="button" className="mt-3 text-primary" onClick={() => setPostsRetryCount((count) => count + 1)}>
            다시 시도
          </button>
        </div>
      ) : (
        <MyPostsList
          currentPage={postPage}
          setCurrentPage={setPostPage}
          searchKeyword={searchKeyword}
          deletePost={deletePost}
          posts={posts}
          setPosts={setPosts}
          handlePageChange={handlePostPageChange}
        />
      )}

      <h3 className="mb-4">내가 쓴 댓글</h3>
      <MyCommentSection
        currentPage={commentPage}
        setCurrentPage={setCommentPage}
        searchKeyword={searchKeyword}
        comments={comments}
        setComments={setComments}
        handlePageChange={handleCommentPageChange}
      />
    </div>
  );
}
