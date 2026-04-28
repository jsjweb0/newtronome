import { useSearchParams, useParams } from 'react-router-dom';
import {usePosts} from '../../contexts/postsContext.jsx';
import {useEffect, useMemo, useState} from "react";
import SearchBar from "../../components/board/SearchBar.jsx";
import SortButtonGroup from "../../components/board/SortButtonGroup.jsx";
import PostList from "../../components/board/PostList.jsx";
import Pagination from "../../components/board/Pagination.jsx";
import WriteButton from "../../components/auth/WriteButton.jsx";
import PostListSkeleton from "../../components/board/PostListSkeleton.jsx";
import {getCurrentPageItems, getTotalPages} from "../../utils/pagination.js";

const VALID_BOARD_TYPES = ['notice', 'free', 'pet'];

export default function BoardPage() {
    const {boardType} = useParams();
    const {getPosts, deletePost} = usePosts();
    const [posts, setLocalPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchParams, setSearchParams] = useSearchParams();
    const pageParam = parseInt(searchParams.get('page')) || 1;
    const keywordParam = searchParams.get('keyword') || '';
    const sortParam = searchParams.get('sort') === 'asc';

    const [currentPage, setCurrentPage] = useState(pageParam);
    const [searchKeyword, setSearchKeyword] = useState(keywordParam);
    const [dateSort, setDateSort] = useState(sortParam);

    useEffect(() => {
        if (!boardType) return;
        const fetchData = async () => {
            setLoading(true);
            const result = await getPosts(boardType);
            setLocalPosts(result);
            setLoading(false);
        };
        fetchData();
    }, [boardType]);

    const filteredPosts = useMemo(() => {
        return posts
            .slice()
            .sort((a, b) => (dateSort
                    ? a.id - b.id
                    : b.id - a.id
            ))
            .filter(post => (post.title || '').toLowerCase().includes(searchKeyword.toLowerCase()));
    }, [posts, searchKeyword, dateSort]);

    const totalItems = filteredPosts.length;
    const totalPages = getTotalPages(totalItems);
    const currentItems = getCurrentPageItems(filteredPosts, currentPage);

    const handlePageChange = (newPage) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set("page", newPage);
        setSearchParams(newParams);
    };

    useEffect(() => {
        const pageFromParams = parseInt(searchParams.get('page'));
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
    }, [searchKeyword, dateSort]);

    // 존재하지 않는 게시판 처리
    if (!VALID_BOARD_TYPES.includes(boardType)) {
        return (
            <div className="max-w-[85rem] mx-auto mt-20 px-4 text-center">
                <h2 className="font-bold">존재하지 않는 게시판입니다.</h2>
                <p className="text-gray-500 dark:text-neutral-400">
                    주소를 확인해 주세요.
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="mb-8 px-4">
                <h2 className="text-lg md:text-2xl text-center font-bold text-gray-800 dark:text-white">
                    {boardType === 'notice' ? '공지사항' : boardType === 'free' ? '자유게시판' : '게시판'}
                </h2>
                <PostListSkeleton/>
            </div>
        )
    }

    return (
        <div className="max-w-[85rem] mx-auto mb-8 px-4">
            <h2 className="text-lg md:text-2xl text-center font-bold text-gray-800 dark:text-white">
                {boardType === 'notice' ? '공지사항' : boardType === 'free' ? '자유게시판' : '게시판'}
            </h2>
            <SearchBar posts={posts} searchKeyword={searchKeyword} setSearchKeyword={setSearchKeyword}/>
            <SortButtonGroup
                posts={posts}
                setPosts={setLocalPosts}
                initialNotice={posts}
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

            <WriteButton boardType={boardType}/>

            <Pagination
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />

        </div>
    )
}
