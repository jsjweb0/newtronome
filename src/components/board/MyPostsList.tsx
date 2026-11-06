import { useEffect, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { CommunityBoardType, Post } from '../../features/board/types/post';
import { useToast } from '../../contexts/ToastContext';
import Pagination from './Pagination';
import MyPostItem from './MyPostItem';
import {
  getCurrentPageItems,
  getTotalPages,
} from '../../utils/pagination';

type MyPostsListProps = {
  handlePageChange: (page: number) => void;
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  searchKeyword: string;
  posts: Post[];
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

    try {
      await deletePost(boardType, postId);

      showToast({
        message: '게시글이 삭제되었습니다.',
        type: 'success',
      });
    } catch {
      showToast({
        message: '삭제에 실패했습니다.',
        type: 'error',
      });
    }
  };

  if (!filteredPosts.length) {
    return (
      <p role="status" className="py-8 text-center text-sm text-textSub border-t border-textThr">
        작성한 글이 없습니다.
      </p>
    );
  }

  return (
    <>
      <ul className="border-t border-textThr">
        {currentItems.map((post) => (
          <MyPostItem
            key={`${post.boardType}-${post.id}`}
            post={post}
            onDelete={() => handleDelete(post.boardType, post.id)}
          />
        ))}
      </ul>

      <Pagination
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        label="게시물 페이지"
      />
    </>
  );
}
