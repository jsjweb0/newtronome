import { useSearchParams, useParams } from 'react-router-dom';
import {
  isCommunityBoardType,
  type Post,
  usePosts,
} from '../../contexts/PostsContext';
import { useEffect, useMemo, useState } from 'react';
import SearchBar from '../../components/board/SearchBar';
import SortButtonGroup from '../../components/board/SortButtonGroup';
import PostList from '../../components/board/PostList';
import Pagination from '../../components/board/Pagination';
import WriteButton from '../../components/auth/WriteButton';
import PostListSkeleton from '../../components/board/PostListSkeleton';
import { getCurrentPageItems, getTotalPages } from '../../utils/pagination';
import CategoryFilter, {
  type CategoryFilterValue,
} from '../../components/board/CategoryFilter';
import { isFreeBoardCategoryValue } from '../../constants/freeBoardCategories';
import { RotateCcw } from 'lucide-react';

export default function BoardPage() {
  const { boardType } = useParams();
  const { getPosts, deletePost } = usePosts();
  const [posts, setLocalPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = Number(searchParams.get('page') ?? '1');
  const keywordParam = searchParams.get('keyword') || '';
  const sortParam = searchParams.get('sort') === 'asc';
  const categoryParam = searchParams.get('category');

  const selectedCategory: CategoryFilterValue =
    boardType === 'free' &&
      categoryParam &&
      isFreeBoardCategoryValue(categoryParam)
      ? categoryParam
      : '';

  const searchKeyword = keywordParam;
  const [draftKeyword, setDraftKeyword] = useState(keywordParam);
  const dateSort = sortParam;

  useEffect(() => {
    if (!isCommunityBoardType(boardType)) return;

    let ignore = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getPosts(boardType);

        if (!ignore) setLocalPosts(result);

      } catch {
        if (!ignore) setError('게시글을 불러오지 못했습니다.');
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchData();

    return () => {
      ignore = true;
    };
  }, [boardType, getPosts, retryCount]);

  const filteredPosts = useMemo(() => {
    return posts
      .slice()
      .sort((a, b) => {
        const firstPostNo = Number.isFinite(Number(a.postNo)) ? Number(a.postNo) : 0;
        const secondPostNo = Number.isFinite(Number(b.postNo)) ? Number(b.postNo) : 0;
        return dateSort ? firstPostNo - secondPostNo : secondPostNo - firstPostNo;
      })
      .filter((post) => {
        const matchesKeyword = (post.title || '')
          .toLowerCase()
          .includes(searchKeyword.toLowerCase());

        const matchesCategory =
          selectedCategory === '' ||
          post.category === selectedCategory;

        return matchesKeyword && matchesCategory;
      });
  }, [posts, searchKeyword, selectedCategory, dateSort]);

  const totalItems = filteredPosts.length;
  const totalPages = Math.max(1, getTotalPages(totalItems));
  const currentPage = Number.isSafeInteger(pageParam)
    ? Math.min(Math.max(pageParam, 1), totalPages)
    : 1;
  const currentItems = getCurrentPageItems(filteredPosts, currentPage);

  const handleSearch = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('keyword', draftKeyword);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleSortChange = (nextSort: boolean) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', nextSort ? 'asc' : 'desc');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
  };

  useEffect(() => {
    setDraftKeyword(keywordParam)
  }, [keywordParam]);

  const handleCategoryChange = (
    category: CategoryFilterValue
  ) => {
    const newParams = new URLSearchParams(searchParams);

    newParams.set('page', '1');

    if (category) {
      newParams.set('category', category);
    } else {
      newParams.delete('category');
    }

    setSearchParams(newParams);
  };

  // 존재하지 않는 게시판 처리
  if (!isCommunityBoardType(boardType)) {
    return (
      <div className="max-w-[85rem] mx-auto mt-20 px-4 text-center">
        <h2 className="font-bold">존재하지 않는 게시판입니다.</h2>
        <p className="text-gray-500 dark:text-neutral-400">주소를 확인해 주세요.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mb-8 px-4">
        <h2 className="text-lg md:text-2xl text-center font-bold text-gray-800 dark:text-white">
          {boardType === 'notice' ? '공지사항' : boardType === 'free' ? '자유게시판' : '게시판'}
        </h2>
        <PostListSkeleton />
      </div>
    );
  }

  if (error !== null) {
    return (
      <div className="mx-auto max-w-[85rem] px-4 py-10">
        <p role="alert">{error}</p>
        <button
          type="button"
          onClick={() => setRetryCount((previousCount) => previousCount + 1)}
          className="inline-flex gap-2"
        >
          다시 시도 <RotateCcw aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[85rem] mx-auto px-4 py-10">
      <h2 className="text-lg md:text-2xl text-center font-bold text-gray-800 dark:text-white">
        {boardType === 'notice' ? '공지사항' : boardType === 'free' ? '자유게시판' : '게시판'}
      </h2>

      {boardType === 'free' && (
        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />
      )}

      <SearchBar
        searchKeyword={draftKeyword}
        setSearchKeyword={setDraftKeyword}
        onSearch={handleSearch}
      />

      <SortButtonGroup
        posts={posts}
        dateSort={dateSort}
        setDateSort={handleSortChange}
      />
      <PostList
        posts={posts}
        filteredPosts={currentItems}
        setPosts={setLocalPosts}
        searchKeyword={searchKeyword}
        boardType={boardType}
        currentPage={currentPage}
        dateSort={dateSort}
        deletePost={(postId) => deletePost(boardType, postId)}
      />
      {totalItems === 0 && (
        <p
          role="status"
          className="py-10 text-center text-sm text-gray-500 dark:text-neutral-400"
        >
          {posts.length === 0
            ? '아직 등록된 게시글이 없습니다.'
            : searchKeyword
              ? '검색 결과가 없습니다. 다른 검색어로 검색해 보세요.'
              : selectedCategory
                ? '이 카테고리에 등록된 게시글이 없습니다.'
                : '표시할 게시글이 없습니다.'}
        </p>
      )}

      <WriteButton boardType={boardType} />

      <Pagination
        currentPage={currentPage}
        setCurrentPage={handlePageChange}
        totalPages={totalPages}
      />
    </div>
  );
}
