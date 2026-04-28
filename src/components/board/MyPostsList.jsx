import {useEffect, useMemo, useState} from 'react';
import {useToast} from "../../contexts/useToast.js";
import Pagination from '../../components/board/Pagination.jsx';
import MyPostItem from './MyPostItem.jsx';
import {getCurrentPageItems, getTotalPages, DEFAULT_ITEMS_PER_PAGE} from "../../utils/pagination.js";

export default function MyPostsList({
                                        loadingPosts,
                                        handlePageChange,
                                        currentPage,
                                        setCurrentPage,
                                        searchKeyword,
                                        posts,
                                        setPosts,
                                        deletePost
}) {
    const {showToast} = useToast();

    // 1) 검색어·페이징용 필터링
    const filteredPosts = useMemo(() => {
        return posts
            .slice()
            .filter(p => p.title.toLowerCase().includes(searchKeyword.toLowerCase()))
            .sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [posts, searchKeyword]);

    // 2) 페이징 계산
    const totalItems = filteredPosts.length;
    const totalPages = getTotalPages(totalItems);
    const currentItems = getCurrentPageItems(filteredPosts, currentPage);

    // 페이지 범위 벗어나면 1로 리셋
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages || 1);
        }
    }, [totalPages, currentPage, setCurrentPage]);

    // 삭제 핸들러
    const handleDelete = async (boardType, postId) => {
        if (!window.confirm('정말 삭제하시겠습니까?')) return;

        await deletePost(boardType, postId);
        setPosts(prev => prev.filter(p => !(p.id === postId && p.boardType === boardType)));
        showToast({message: '게시글이 삭제되었습니다.', type: 'success'});
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
           <div
               className="divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden text-gray-500 text-xs md:text-base text-left md:text-center dark:border-neutral-700 dark:text-neutral-400">
               {currentItems.map((post, idx) => {
                   const itemNumber = (currentPage - 1) * DEFAULT_ITEMS_PER_PAGE + (currentItems.length - idx);

                   return (
                       <MyPostItem
                           key={`${post.boardType}-${post.id}`}
                           idx={itemNumber}
                           post={post}
                           onDelete={() => handleDelete(post.boardType, post.id)}
                       />
                   )
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
