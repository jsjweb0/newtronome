import {useLocation, useNavigate, useParams, useSearchParams} from "react-router-dom";
import {Link} from "react-router-dom";
import {useToast} from "../../contexts/ToastContext.jsx";
import {useNotifications} from "../../contexts/NotificationContext.jsx";
import {usePosts} from "../../contexts/postsContext.jsx";
import {useEffect, useState} from "react";
import {AuthAccess} from "../../components/auth/AuthAccess.jsx";
import {BaseButton} from "../../components/ui/BaseButton.jsx";
import {
    AlignJustify,
    ArrowLeft,
    ArrowRight,
    SquarePen,
    Trash2,
    MessageCircle,
} from "lucide-react";
import LikeButton from "../../components/ui/LikeButton.jsx"
import PostCommentSection from "../../components/board/PostCommentSection.jsx";
import {getCommentCountFromDB} from "../../utils/comment";
import ShareButton from "../../components/board/ShareButton.jsx";
import PostViewSkeleton from "./PostViewSkeleton.jsx";
import Tooltip from "../../components/ui/Tooltip.jsx";
import {formatDate} from "../../utils/format.js";

export default function PostView() {
    const {showToast} = useToast();
    const {addNotification} = useNotifications();
    const {boardType, id} = useParams();
    const {getPosts, updateViewCount, deletePost} = usePosts();
    const [postsState, setPostsState] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPost, setCurrentPost] = useState(null);

    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const page = location.state?.page || parseInt(searchParams.get("page")) || 1;
    const keyword = location.state?.keyword || searchParams.get("keyword") || '';
    const sort = location.state?.sort || searchParams.get("sort") || 'desc';

    const currentIndex = postsState.findIndex(p => String(p.id) === id);
    const prevPost = postsState[currentIndex - 1];
    const nextPost = postsState[currentIndex + 1];
    const pagerBtnClasses = "shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 group-hover:bg-gray-50 group-focus:outline-hidden group-focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:group-hover:bg-neutral-700 dark:focus:bg-neutral-700";
    const pagerClasses = "overflow-hidden block relative pb-1 whitespace-nowrap overflow-ellipsis after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-gray-500 after:transition-width after:duration-300 group-hover:after:w-full";

    const [commentCount, setCommentCount] = useState(0);

    useEffect(() => {
        const fetchPost = async () => {
            const posts = await getPosts(boardType);
            setPostsState(posts);

            const post = posts.find(p => String(p.id) === id);
            if (!post) {
                setCurrentPost(null);
                setLoading(false);
                return;
            }

            if (!post.__viewed) {
                await updateViewCount(boardType, id);
                const updated = posts.map(p =>
                    String(p.id) === id
                        ? {...p, viewCount: (p.viewCount || 0) + 1, __viewed: true}
                        : p
                );
                setPostsState(updated);
                setCurrentPost({...post, viewCount: (post.viewCount || 0) + 1, __viewed: true});
            } else {
                setCurrentPost(post);
            }

            setLoading(false);
        };
        fetchPost();
    }, [boardType, id, getPosts, updateViewCount]);

    useEffect(() => {
        if (boardType !== 'pet' && currentPost?.id) {
            let mounted = true;
            getCommentCountFromDB(boardType, currentPost.id)
                .then(count => {
                    if (mounted) setCommentCount(count);
                })
                .catch(() => {
                    if (mounted) setCommentCount(0);
                });
            return () => {
                mounted = false;
            }
        }
    }, [boardType, currentPost]);


    if (loading) return <PostViewSkeleton/>;
    if (!currentPost) return <div className="text-center mt-10 font-bold">존재하지 않는 게시글입니다.</div>;

    const deletePosts = async (targetId) => {
        if (!window.confirm("삭제하시겠습니까?")) return;

        const id = Date.now();
        const notification = { id, message: '게시글이 삭제되었습니다.' };
        const notificationErr = { id, message: '삭제에 실패했습니다.' };

        try {
            await deletePost(boardType, targetId);
            showToast({ message: notification.message });
            addNotification(notification);

            navigate(`/board/${boardType}?page=${page || 1}&keyword=${keyword || ""}&sort=${sort || "desc"}`);
        } catch (err) {
            console.error(err);
            showToast({ message: notificationErr.message });
            addNotification(notificationErr);
        }
    };

    return (
        <div className="max-w-[85rem] mx-auto px-4">
            <div
                className="flex flex-row max-md:flex-col items-center justify-between gap-2 px-4 py-4 border-y border-gray-300">
                <h4 className="font-medium text-sm md:text-xl">
                    <span
                        className="block md:inline-block md:mr-3 text-sm md:text-base text-center text-gray-500 dark:text-neutral-400">{currentPost.category}</span>
                    {currentPost.title}
                </h4>
                <ul className="shrink-0 flex divide-x divide-gray-300 dark:divide-neutral-700">
                    <li className="px-3 border-gray-300 text-gray-500 text-xs md:text-base dark:text-gray-400">
                        {boardType === 'notice' ? '관리자' : boardType === 'free' ? currentPost.displayName : currentPost.email}
                    </li>
                    <li className="px-3 text-gray-500 text-xs md:text-base dark:text-gray-400">{formatDate(currentPost.date)}</li>
                    <li className="px-3 text-gray-500 text-xs md:text-base dark:text-gray-400">조회수 {currentPost.viewCount}</li>
                </ul>
            </div>
            {currentPost.updatedAt &&
                <p className="flex justify-end gap-x-2 mt-3 text-right text-gray-500 text-xs md:text-base dark:text-gray-400">
                    수정일 <span>{formatDate(currentPost.updatedAt, true)}</span>
                </p>}
            <div className="py-5 px-3 md:py-12 md:px-7 border-b border-gray-300">
                <AuthAccess allow={["admin", currentPost.email]}>
                    <div className="flex gap-2 justify-center md:justify-start mb-8">
                        <Link to={`/board/${boardType}/edit/${currentPost.id}`}
                              className="flex items-center gap-1 text-xs md:text-sm text-gray-600 dark:text-white/60">
                            <SquarePen className="shrink-0 size-4 dark:text-white/60"/>
                            수정
                        </Link>
                        <button type="button" onClick={() => {
                            deletePosts(currentPost.id)
                        }} className="flex items-center gap-1 text-xs md:text-sm text-gray-600 dark:text-white/60">
                            <Trash2 className="shrink-0 size-4 dark:text-white/60"/>
                            삭제
                        </button>
                    </div>
                </AuthAccess>
                <pre className="whitespace-pre-wrap font-[Pretendard] text-xs md:text-base"
                     dangerouslySetInnerHTML={{__html: currentPost.content}}></pre>

                {/* Sticky Share Group */}
                <div className="mt-8 sticky bottom-6 inset-x-0 text-center">
                    <div className="inline-block bg-white shadow-md rounded-full py-3 px-4 dark:bg-neutral-800">
                        <div className="flex items-center gap-x-1.5">
                            <Tooltip content="like">
                                <LikeButton docId={currentPost.id}
                                            collection={boardType}
                                            initialCount={currentPost.likeCount}
                                />
                            </Tooltip>
                            <div className="block h-3 border-e border-gray-300 mx-3 dark:border-neutral-600"></div>

                            {/* Button */}
                            <div className="relative inline-block">
                                <div
                                    className="group flex items-center gap-x-2 text-sm text-gray-500 hover:text-gray-800 focus:outline-hidden focus:text-gray-800 dark:text-neutral-400 dark:hover:text-neutral-200 dark:focus:text-neutral-200">
                                    <MessageCircle className="shrink-0 size-4"/>
                                    {commentCount > 0 ? commentCount : '0'}
                                    <span
                                        className="opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity inline-block absolute z-10 left-1/2 -translate-x-1/2 -translate-y-full py-1 px-2 bg-gray-900 text-xs font-medium text-white rounded-md shadow-2xs dark:bg-black"
                                        role="tooltip">
                                        Comment
                                      </span>
                                </div>
                            </div>
                            <div className="block h-3 border-e border-gray-300 mx-3 dark:border-neutral-600"></div>
                            <ShareButton/>
                            {/* Button */}
                        </div>
                    </div>
                </div>
                {/* End Sticky Share Group */}
            </div>

            <div className="flex justify-between items-center mt-6 md:mt-10 max-md:justify-center">
                <div className="max-md:hidden w-[40%]">
                    {prevPost ? (
                        <Link to={`/board/${boardType}/${prevPost.id}?page=${page}&keyword=${keyword}&sort=${sort}`}
                              className="group overflow-hidden flex items-center gap-3 text-gray-500 dark:text-white/60">
                            <i className="sr-only">이전글</i>
                            <span className={pagerBtnClasses}>
                                <ArrowLeft className="size-4 stroke-gray-400"/>
                            </span>
                            <span className={pagerClasses}>{prevPost.title}</span>
                        </Link>
                    ) : (<p className="text-gray-500 dark:text-white/60">이전글이 없습니다.</p>)
                    }
                </div>
                <div className="shrink-0 inline-flex">
                    <ul>
                        <li>
                            <BaseButton
                                onClick={() => {
                                    const query = new URLSearchParams();
                                    query.set("page", page || 1);
                                    if (keyword) query.set("keyword", keyword);
                                    query.set("sort", sort || "desc");
                                    navigate({
                                        pathname: `/board/${boardType}`,
                                        search: `?${query.toString()}`,
                                    }, {
                                        state: {
                                            page: page || 1,
                                            keyword: keyword || '',
                                            sort: sort || 'desc',
                                        }
                                    });
                                }}
                                variant="outline"
                            >
                                <AlignJustify
                                    className="shrink-0 size-4 text-gray-600 group-hover:text-blue-600 dark:text-white/60"/>
                                목록
                            </BaseButton>
                        </li>
                    </ul>
                </div>
                <div className="max-md:hidden w-[40%] text-right">
                    {nextPost ? (
                        <Link to={`/board/${boardType}/${nextPost.id}?page=${page}&keyword=${keyword}&sort=${sort}`}
                              className="group flex items-center justify-end gap-3 text-gray-500 dark:text-white/60">
                            <i className="sr-only">다음글</i>
                            <span className={pagerClasses}>{nextPost.title}</span>
                            <span className={pagerBtnClasses}>
                                <ArrowRight className="size-4 stroke-gray-400"/>
                            </span>
                        </Link>
                    ) : (<p className="text-gray-500 dark:text-white/60">다음글이 없습니다.</p>)
                    }
                </div>
            </div>

            {/*댓글기능*/}
            <PostCommentSection boardType={boardType} postId={currentPost.id} onCommentChange={setCommentCount}/>
            {/*댓글기능*/}
        </div>
    );
}