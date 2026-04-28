import {Link} from "react-router-dom";
import {AuthAccess} from "../auth/AuthAccess.jsx";
import {useToast} from "../../contexts/ToastContext.jsx";
import {getCommentCountFromDB} from "../../utils/comment";
import {BaseButton} from "../ui/BaseButton.jsx";
import {useEffect, useState} from "react";
import {formatDate} from "../../utils/format.js";
import {useNotifications} from "../../contexts/NotificationContext.jsx";

function PostItem({post, posts, searchKeyword, setPosts, boardType, currentPage, dateSort, deletePost}) {
    const {showToast} = useToast();
    const {addNotification} = useNotifications();
    const [commentCount, setCommentCount] = useState(0);

    useEffect(() => {
        let mounted = true;
        getCommentCountFromDB(boardType, post.id)
            .then(count => {
                if (mounted) setCommentCount(count);
            })
            .catch(() => {
                if (mounted) setCommentCount(0);
            });
        return () => {
            mounted = false;
        };
    }, [boardType, post.id]);

    const categoryColorMap = {
        "카테고리1": "text-blue-500 font-normal",
        "카테고리2": "text-fuchsia-900 font-normal",
        "카테고리3": "text-gray-400 font-normal",
        "카테고리4": "text-neutral-500 font-normal",
    };
    const displayAuthor = boardType === 'notice'
        ? '관리자'
        : boardType === 'free'
            ? post.displayName
            : post.email

    const highlightText = (text, keyword) => {
        if (!keyword) return text;

        const regex = new RegExp(`(${keyword})`, 'gi');
        return text.split(regex).map((part, i) =>
            part.toLowerCase() === keyword.toLowerCase() ? (
                <mark key={i}>{part}</mark>
            ) : (
                <span key={i}>{part}</span>
            )
        );
    };

    const deletePosts = async (targetId) => {
        if (!window.confirm("삭제하시겠습니까?")) return;

        const id = Date.now();
        const notification = { id, message: '삭제에 실패했습니다.', type: 'error' };

        try {
            await deletePost(targetId);
            setPosts(prev => prev.filter(p => p.id !== targetId));
            showToast({message: '게시글이 삭제되었습니다.', type: 'success'});
        } catch (err) {
            console.error(err);
            showToast({ message: notification.message });
            addNotification(notification);
        }
    };

    return (
        <div
            className="grid grid-cols-1 md:grid-cols-13 gap-2 px-4 py-3 text-xs md:text-base sm:items-center hover:bg-gray-50 dark:hover:bg-neutral-800 dark:border-neutral-700"
        >
            <div>
                {post.isNotice ? (
                    <span
                        className="shrink-0 inline-block px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-full">
                      📌 공지
                    </span>
                ) : (
                    <span>{Number.isFinite(post.id) ? post.id : '번호없음'}</span>
                )}
            </div>
            <div className="flex items-start md:items-center flex-col md:flex-row gap-2 md:col-span-7 text-left">
                <Link
                    to={`/board/${boardType}/${post.id}?page=${currentPage}&keyword=${searchKeyword}&sort=${dateSort ? 'asc' : 'desc'}`}
                    className="overflow-hidden inline-flex items-center max-w-full py-2 font-medium text-gray-900 dark:text-white"
                    state={{
                        page: currentPage, sort: dateSort, keyword: searchKeyword
                    }}
                >
                    {post.category && (
                        <span
                            className={`shrink-0 inline-block ${categoryColorMap[post.category] || 'text-gray-500'} mr-2`}>[{post.category}]</span>
                    )}

                    <span
                        className="inline-block truncate">
                        {highlightText(post.title, searchKeyword)}
                    </span>

                    {commentCount > 0 && (
                        <i className="shrink-0 inline-block not-italic text-xs text-gray-500 px-2">
                            {commentCount}
                        </i>
                    )}
                </Link>
                <AuthAccess allow={["admin"]}>
                    <div className="shrink-0 flex justify-start md:justify-center items-center gap-1">
                        <BaseButton as="link" to={`/board/${boardType}/edit/${post.id}`}
                                    className="!px-3 !py-2 md:text-sm"
                                    variant="cancel">수정</BaseButton>
                        <BaseButton variant="cancel"
                                    className="!px-3 !py-2 md:text-sm"
                                    onClick={() => {
                                        deletePosts(post.id)
                                    }}>삭제</BaseButton>
                    </div>
                </AuthAccess>
            </div>
            <div className="md:col-span-2">
                {displayAuthor}
            </div>
            <div>{Number.isFinite(post.viewCount) ? post.viewCount : 0}</div>
            <div className="md:col-span-2">{formatDate(post.date)}</div>
        </div>
    )
}

export default PostItem;