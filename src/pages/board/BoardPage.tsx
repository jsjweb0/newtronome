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

export default function BoardPage() {
  const { boardType } = useParams();
  const { getPosts, deletePost } = usePosts();
  const [posts, setLocalPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = Number.parseInt(searchParams.get('page') ?? '', 10) || 1;
  const keywordParam = searchParams.get('keyword') || '';
  const sortParam = searchParams.get('sort') === 'asc';
  const categoryParam = searchParams.get('category');

  const selectedCategory: CategoryFilterValue =
    boardType === 'free' &&
      categoryParam &&
      isFreeBoardCategoryValue(categoryParam)
      ? categoryParam
      : '';

  const [currentPage, setCurrentPage] = useState(pageParam);
  const [searchKeyword, setSearchKeyword] = useState(keywordParam);
  const [dateSort, setDateSort] = useState(sortParam);

  useEffect(() => {
    if (!isCommunityBoardType(boardType)) return;

    const fetchData = async () => {
      setLoading(true);
      const result = await getPosts(boardType);
      setLocalPosts(result);
      setLoading(false);
    };
    fetchData();
  }, [boardType, getPosts]);

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
  const totalPages = getTotalPages(totalItems);
  const currentItems = getCurrentPageItems(filteredPosts, currentPage);

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
  };

  useEffect(() => {
    const pageFromParams = Number.parseInt(searchParams.get('page') ?? '', 10);
    const keywordFromParams = searchParams.get('keyword') || '';
    const sortFromParams = searchParams.get('sort') === 'asc';

    setCurrentPage(!isNaN(pageFromParams) ? pageFromParams : 1);
    setSearchKeyword(keywordFromParams);
    setDateSort(sortFromParams);
  }, [searchParams]);

  useEffect(() => {
    const currentKeyword = searchParams.get('keyword') || '';
    const currentSort = searchParams.get('sort') || 'desc';

    if (currentKeyword !== searchKeyword || currentSort !== (dateSort ? 'asc' : 'desc')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('page', '1');
      newParams.set('keyword', searchKeyword);
      newParams.set('sort', dateSort ? 'asc' : 'desc');
      setSearchParams(newParams);
    }
  }, [searchKeyword, dateSort, searchParams, setSearchParams]);

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
        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}
      />

      <SortButtonGroup
        posts={posts}
        dateSort={dateSort}
        setDateSort={setDateSort}
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

      <WriteButton boardType={boardType} />

      <Pagination
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
