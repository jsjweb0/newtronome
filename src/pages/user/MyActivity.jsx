import {useNavigate} from "react-router-dom";
import {useLocation, useSearchParams} from 'react-router-dom';
import {useEffect, useMemo, useState} from "react";
import {useAuth} from "../../contexts/AuthContext.jsx";
import MyPostsList from "../../components/board/MyPostsList.jsx";
import MyCommentSection from "../../components/board/MyCommentSection.jsx";
import {MessageSquareText, NotebookPen} from "lucide-react";
import {usePosts} from "../../contexts/postsContext.jsx";
import {useToast} from "../../contexts/ToastContext.jsx";
import SearchBar from "../../components/board/SearchBar.jsx";
import PostListSkeleton from "../../components/board/PostListSkeleton.jsx";

export default function MyActivity() {
    const navigate = useNavigate();
    const {user, loading} = useAuth();
    const {getMyPosts, deletePost} = usePosts();

    const [posts, setPosts] = useState([]);
    const [comments, setComments] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const BOARD_TYPES = ["notice", "free", "pet"];

    // URL 쿼리 & 로컬 상태
    const [searchParams, setSearchParams] = useSearchParams();
    const pageParam = parseInt(searchParams.get('page')) || 1;
    const keywordParam = searchParams.get('keyword') || '';
    const [postPage, setPostPage] = useState(pageParam);
    const [commentPage, setCommentPage] = useState(pageParam);
    const [searchKeyword, setSearchKeyword] = useState(keywordParam);

    // 1. 각각의 페이지 번호를 관리할 state
    useEffect(() => {
        if (loading) return;
        if (!user) return navigate("/login", { replace: true });
    }, [loading, user]);

    // 1) “내 글” 로드
    useEffect(() => {
        (async () => {
            setLoadingPosts(true);
            const arr = await Promise.all(
                BOARD_TYPES.map(type => getMyPosts(type))
            );
            const data = arr.flat();
            //console.log("loaded posts:", data);
            setPosts(data);
            setLoadingPosts(false);
        })();
    }, []);

    // 2) URL → state 동기화
    useEffect(() => {
        const p = parseInt(searchParams.get('page'));
        const kw = searchParams.get('keyword') || '';
        setPostPage(isNaN(p) ? 1 : p);
        setCommentPage(isNaN(p) ? 1 : p);
        setSearchKeyword(kw);
    }, [searchParams]);

    // 5) 검색어 변경 시 URL 리셋
    useEffect(() => {
        const qp = new URLSearchParams(searchParams);
        qp.set('page', '1');
        qp.set('keyword', searchKeyword);
        setSearchParams(qp);
    }, [searchKeyword]);

    const handlePostPageChange = (page) => {
        setPostPage(page);
        // URL 동기화도 따로 해주려면 searchParams.set('postPage', page)…
    };

    const handleCommentPageChange = (page) => {
        setCommentPage(page);
        // searchParams.set('commentPage', page)
    };

    if (loadingPosts) return (
        <PostListSkeleton />
    );

    return (
        <div className="mb-8 px-4 lg:px-8">
            {/* Card Section */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
                {/* Card */}
                <div className="flex flex-col border border-textThr shadow-2xs rounded-xl">
                    <div className="p-4 md:p-5 flex gap-x-4">
                        <div className="shrink-0 flex justify-center items-center size-11 rounded-lg bg-gray-50 dark:bg-background">
                            <NotebookPen className="text-textBase/80"/>
                        </div>

                        <div className="grow">
                            <div className="flex items-center gap-x-2">
                                <p className="text-xs text-textSub">
                                    총 게시물
                                </p>
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
                            <MessageSquareText className="text-textBase/80"/>
                        </div>

                        <div className="grow">
                            <div className="flex items-center gap-x-2">
                                <p className="text-xs text-textSub">
                                    총 댓글
                                </p>
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

            <SearchBar
                searchKeyword={searchKeyword}
                setSearchKeyword={setSearchKeyword}
            />

            <h3 className="mb-4">나의 게시물</h3>
            <MyPostsList
                loadingPosts={loadingPosts}
                currentPage={postPage}
                setCurrentPage={setPostPage}
                searchKeyword={searchKeyword}
                deletePost={deletePost}
                posts={posts}
                setPosts={setPosts}
                handlePageChange={handlePostPageChange}
            />

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
