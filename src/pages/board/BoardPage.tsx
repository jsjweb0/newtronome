import { useSearchParams, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Activity, Disc3 } from 'lucide-react';
import {
  isCommunityBoardType,
  type CommunityBoardType,
} from '../../features/board/types/post';
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
import RetryErrorState from '../../components/ui/RetryErrorState';
import { filterAndSortBoardPosts } from '../../features/board/utils/filterAndSortBoardPosts';

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

  const filteredPosts = useMemo(
    () =>
      filterAndSortBoardPosts(data ?? [], {
        keyword: searchKeyword,
        category: selectedCategory,
        sort: dateSort ? 'asc' : 'desc',
      }),
    [data, searchKeyword, selectedCategory, dateSort],
  );

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
      <section aria-labelledby="board-title" className={sectionClasses}>
        <BoardHeader boardType={boardType} />
        <div role="status">
          <span className="sr-only">게시글을 불러오는 중입니다.</span>
          <PostListSkeleton />
        </div>
      </section>
    );
  }

  const queryError = isError ? (
    <RetryErrorState
      message={
        data === undefined
          ? '게시글을 불러오지 못했습니다.'
          : '최신 목록을 불러오지 못했습니다. 이전 목록을 표시합니다.'
      }
      isRetrying={isFetching}
      onRetry={() => {
        void refetch();
      }}
    />
  ) : null;

  if (isError && data === undefined) {
    return queryError;
  }

  return (
    <section aria-labelledby="board-title" className={sectionClasses}>
      <BoardHeader boardType={boardType} totalCount={posts.length}>
        <WriteButton boardType={boardType} />
      </BoardHeader>

      {queryError}

      {isFetching && !isError && (
        <p role="status" className="-mt-2 text-sm text-textSub">
          최신 목록을 확인하고 있습니다.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {boardType === 'free' && (
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />
        )}

        <div className="flex items-center gap-2 max-md:w-full md:ml-auto">
          <SearchBar
            className="max-md:flex-1"
            searchKeyword={draftKeyword}
            setSearchKeyword={setDraftKeyword}
            onSearch={handleSearch}
          />

          <SortButtonGroup
            dateSort={dateSort}
            setDateSort={handleSortChange}
          />
        </div>
      </div>

      <div>
        <PostList
          posts={posts}
          filteredPosts={currentItems}
          currentPage={currentPage}
          searchKeyword={searchKeyword}
          boardType={boardType}
          selectedCategory={selectedCategory}
          dateSort={dateSort}
          deletePost={deletePost}
        />
        {totalItems === 0 && (
          <p
            role="status"
            className="py-12 text-center text-sm text-textSub"
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
      </div>

      <Pagination
        currentPage={currentPage}
        setCurrentPage={handlePageChange}
        totalPages={totalPages}
      />
    </section>
  )
}

const sectionClasses =
  'flex flex-col gap-4 md:gap-5 px-1 md:px-7 pb-6';

const BOARD_META: Record<CommunityBoardType, { title: string; label: string }> = {
  free: { title: 'Free Board', label: '자유게시판' },
  notice: { title: 'Notice', label: '공지사항' },
};

function BoardHeader({
  boardType,
  totalCount,
  children,
}: {
  boardType: CommunityBoardType;
  totalCount?: number;
  children?: ReactNode;
}) {
  const { title, label } = BOARD_META[boardType];
  const Icon = boardType === 'notice' ? Disc3 : Activity;

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex items-center gap-3">
        <Icon aria-hidden="true" className="shrink-0 size-6.5 text-primary" />
        <div>
          <h1 id="board-title" className="text-[28px] leading-tight font-extrabold tracking-tight text-textBase">
            {title}
          </h1>
          <p className="mt-0.5 text-[13px] text-textSub">
            {label}
            {totalCount !== undefined && ` · 총 ${totalCount}개`}
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}
