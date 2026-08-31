import { useEffect, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type {
  CommunityBoardType,
  Post,
} from '../../contexts/PostsContext';
import { useToast } from '../../contexts/ToastContext';
import Pagination from './Pagination';
import MyPostItem from './MyPostItem';
import {
  DEFAULT_ITEMS_PER_PAGE,
  getCurrentPageItems,
  getTotalPages,
} from '../../utils/pagination';

type MyPostsListProps = {
  handlePageChange: (page: number) => void;
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  searchKeyword: string;
  posts: Post[];
  setPosts: Dispatch<SetStateAction<Post[]>>;
  deletePost: (
    boardType: CommunityBoardType,
    postId: Post['id']
  ) => Promise<void>;
}

export default function MyPostsList({
  handlePageChange,
  currentPage,
  setCurrentPage,
  searchKeyword,
  posts,
  setPosts,
  deletePost,
}: MyPostsListProps) {
  const { showToast } = useToast();

  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) =>
        post.title
          .toLowerCase()
          .includes(searchKeyword.toLowerCase())
      )
      .sort(
        (firstPost, secondPost) =>
          (secondPost.date?.getTime() ?? 0) -
          (firstPost.date?.getTime() ?? 0)
      );
  }, [posts, searchKeyword]);

  const totalItems = filteredPosts.length;
  const totalPages = getTotalPages(totalItems);
  const currentItems = getCurrentPageItems(filteredPosts, currentPage);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [totalPages, currentPage, setCurrentPage]);

  const handleDelete = async (
    boardType: CommunityBoardType,
    postId: Post['id']
  ): Promise<void> => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    await deletePost(boardType, postId);

    setPosts((previousPosts) =>
      previousPosts.filter(
        (post) =>
          !(
            post.id === postId &&
            post.boardType === boardType
          )
      )
    );

    showToast({
      message: '게시글이 삭제되었습니다.',
      type: 'success',
    });
  };

  //if (loadingPosts) return <p>로딩 중…</p>;

  if (!filteredPosts.length) {
    return (
      <p className="mt-4 p-4 text-center text-gray-500 text-xs md:text-base">
        작성한 글이 없습니다.
      </p>
    );
  }

  return (
    <div className="mb-5">
      {/* 내 글 목록 */}
      <div className="divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden text-gray-500 text-xs md:text-base text-left md:text-center dark:border-neutral-700 dark:text-neutral-400">
        {currentItems.map((post, idx) => {
          const itemNumber =
            (currentPage - 1) * DEFAULT_ITEMS_PER_PAGE + (currentItems.length - idx);

          return (
            <MyPostItem
              key={`${post.boardType}-${post.id}`}
              idx={itemNumber}
              post={post}
              onDelete={() => handleDelete(post.boardType, post.id)}
            />
          );
        })}
      </div>

      {/* 페이징 */}
      <Pagination
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
