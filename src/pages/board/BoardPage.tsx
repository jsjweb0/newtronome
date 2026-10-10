import { useSearchParams, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  isCommunityBoardType,
  type CommunityBoardType,
} from '../../contexts/PostsContext';
import { useBoardPosts } from '../../features/board/hooks/useBoardPosts';
import { useDeletePost } from '../../features/board/hooks/useDeletePost';
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

  if (!isCommunityBoardType(boardType)) {
    return (
      <div className="max-w-340 mx-auto mt-20 px-4 text-center">
        <h2 className="font-bold">존재하지 않는 게시판입니다.</h2>
        <p className="text-textSub">주소를 확인해 주세요.</p>
      </div>
    );
  }

  return <BoardContent boardType={boardType} />;
}

type BoardContentProps = {
  boardType: CommunityBoardType;
};

function BoardContent({
  boardType,
}: BoardContentProps) {
  const {
    data,
    isPending,
    isError,
    refetch,
    isFetching
  } = useBoardPosts(boardType);

  const { mutateAsync: deletePost } = useDeletePost(boardType);

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

  const filteredPosts = useMemo(() => {
    const posts = data ?? [];

    const matchedPosts = posts.filter((post) => {
      const matchesKeyword = post.title
        .toLowerCase()
        .includes(searchKeyword.toLowerCase());

      const matchesCategory =
        selectedCategory === '' ||
        post.category === selectedCategory;

      return matchesKeyword && matchesCategory;
    });

    return matchedPosts.sort((a, b) => {
      const firstPostNo = Number.isFinite(Number(a.postNo))
        ? Number(a.postNo)
        : 0;

      const secondPostNo = Number.isFinite(Number(b.postNo))
        ? Number(b.postNo)
        : 0;

      return dateSort
        ? firstPostNo - secondPostNo
        : secondPostNo - firstPostNo;
    });
  }, [data, searchKeyword, selectedCategory, dateSort]);

  const totalItems = filteredPosts.length;
  const totalPages = Math.max(1, getTotalPages(totalItems));

  const currentPage = Number.isSafeInteger(pageParam)
    ? Math.min(Math.max(pageParam, 1), totalPages)
    : 1;

  const currentItems = useMemo(
    () => getCurrentPageItems(filteredPosts, currentPage),
    [filteredPosts, currentPage],
  );

  const posts = data ?? [];

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

  if (isPending) {
    return (
      <div className="max-w-340 mx-auto px-4 py-10">
        <h2 className="text-lg md:text-2xl text-center font-bold text-gray-800 dark:text-white">
          {boardType === 'notice' ? '공지사항' : boardType === 'free' ? '자유게시판' : '게시판'}
        </h2>
        <PostListSkeleton />
      </div>
    );
  }

  const queryError = isError ? (
    <div className="my-4 text-center">
      <p role="alert">
        {data === undefined
          ? '게시글을 불러오지 못했습니다.'
          : '최신 목록을 불러오지 못했습니다. 이전 목록을 표시합니다.'}
      </p>

      <button
        type="button"
        disabled={isFetching}
        onClick={() => {
          void refetch();
        }}
        className="inline-flex gap-2 mt-3 text-primary disabled:opacity-50"
      >
        {isFetching ? (
          '다시 불러오는 중…'
        ) : (
          <>
            <RotateCcw aria-hidden="true" />
            다시 시도
          </>
        )}
      </button>
    </div>
  ) : null;

  if (isError && data === undefined) {
    return queryError;
  }

  return (
    <div className="max-w-340 mx-auto px-4 py-10">
      <h2 className="text-lg md:text-2xl text-center font-bold text-gray-800 dark:text-white">
        {boardType === 'notice' ? '공지사항' : boardType === 'free' ? '자유게시판' : '게시판'}
      </h2>

      {queryError}

      {isFetching && !isError && (
        <p role="status" className="text-center text-sm">
          최신 목록을 확인하고 있습니다.
        </p>
      )}

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
        searchKeyword={searchKeyword}
        boardType={boardType}
        currentPage={currentPage}
        selectedCategory={selectedCategory}
        dateSort={dateSort}
        deletePost={deletePost}
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
  )
}
