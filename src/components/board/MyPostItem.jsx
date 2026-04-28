import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCommentCountFromDB } from "../../utils/comment.js";
import { BaseButton } from "../ui/BaseButton.jsx";
import {formatDate} from "../../utils/format.js";

function MyPostItem({ post, idx, onDelete }) {
    const [commentCount, setCommentCount] = useState(0);

    useEffect(() => {
        let mounted = true;
        getCommentCountFromDB(post.boardType, post.id)
            .then(count => {
                if (mounted) setCommentCount(count);
            })
            .catch(() => {
                if (mounted) setCommentCount(0);
            });
        return () => {
            mounted = false;
        };
    }, [post.boardType, post.id]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 md:gap-2 px-4 py-3 text-xs md:text-base sm:items-center hover:bg-gray-50 dark:hover:bg-neutral-800 dark:border-neutral-700">
            {/* 게시글 번호 */}
            <div className="md:col-span-1">{idx}</div>
            <div className="md:col-span-1">{post.boardType === "free" ? "자유게시판" : post.boardType === "notice" ? "공지사항" : "" }</div>

            {/* 제목 및 댓글 수 */}
            <div className="flex items-start md:items-center flex-col md:flex-row gap-2 md:col-span-7 text-left">
                <Link
                    to={`/board/${post.boardType}/${post.id}`}
                    className="overflow-hidden inline-flex items-center max-w-full py-2 font-medium text-gray-900 dark:text-white"
                >
                    <span
                        className="inline-block truncate">
                    {post.title}
                    </span>
                    {commentCount > 0 && (
                        <i className="shrink-0 inline-block not-italic text-xs text-gray-500 px-2">
                            {commentCount}
                        </i>
                    )}
                </Link>
            </div>

            {/* 작성일 */}
            <div className="md:col-span-2">{formatDate(post.date)}</div>

            {/* 삭제 버튼 */}
            <div className="md:col-span-1 max-md:mt-2">
                <BaseButton
                    variant="cancel"
                    className="!px-3 !py-1"
                    onClick={onDelete}
                >
                    삭제
                </BaseButton>
            </div>
        </div>
    );
}

export default MyPostItem;
