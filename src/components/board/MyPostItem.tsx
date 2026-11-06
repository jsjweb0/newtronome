import { Link } from "react-router-dom";
import clsx from "clsx";
import { MessageSquare, Trash2 } from "lucide-react";
import { formatDate } from "../../utils/format";
import type { Post } from "../../features/board/types/post";
import { useCommentCountQuery } from '../../features/board/hooks/useCommentCountQuery';
import { getBoardBadge } from "./boardBadge";

type MyPostItemProps = {
    post: Post;
    onDelete: () => Promise<void>;
};

function MyPostItem({
    post,
    onDelete
}: MyPostItemProps) {
    const commentCountQuery = useCommentCountQuery(
        post.boardType,
        post.id,
    );
    const commentCount = commentCountQuery.data;
    const badge = getBoardBadge(post.boardType);
    const badgeElement = (
        <span className={clsx("shrink-0 px-2 py-0.5 rounded-md text-[11px] font-bold whitespace-nowrap", badge.className)}>
            {badge.label}
        </span>
    );
    const postDate = formatDate(post.date);

    return (
        <li className="grid grid-cols-[minmax(0,1fr)_40px] md:grid-cols-[84px_minmax(0,1fr)_96px_44px] items-center gap-x-3.5 min-h-14.5 px-1.5 py-2.5 md:px-2.5 md:py-0 border-b border-line hover:bg-field/60">
            <span className="max-md:hidden">{badgeElement}</span>

            <div className="min-w-0 flex flex-col gap-0.75">
                <span className="flex items-center gap-2 min-w-0">
                    <span className="md:hidden">{badgeElement}</span>
                    <Link
                        to={`/board/${post.boardType}/${post.id}`}
                        className="min-w-0 truncate text-[15px] font-medium text-textBase hover:text-primary"
                    >
                        {post.title}
                    </Link>
                    {commentCount !== undefined && commentCount > 0 && (
                        <span className="shrink-0 inline-flex items-center gap-0.75 text-xs font-bold text-primary">
                            <MessageSquare aria-hidden="true" className="size-3.5" />
                            <span className="sr-only">댓글</span>
                            {commentCount}
                            <span className="sr-only">개</span>
                        </span>
                    )}

                    {commentCount === undefined && (
                        <span className="shrink-0 text-xs text-textSub">
                            <i aria-hidden="true" className="not-italic">—</i>
                            <i className="sr-only">
                                {commentCountQuery.isError
                                    ? '댓글 수를 불러오지 못했습니다.'
                                    : '댓글 수를 불러오는 중입니다.'}
                            </i>
                        </span>
                    )}
                </span>
                <span className="md:hidden text-xs text-textSub tabular-nums">{postDate}</span>
            </div>

            <span className="max-md:hidden text-center text-[13px] text-textSub tabular-nums">{postDate}</span>

            <button
                type="button"
                onClick={onDelete}
                aria-label={`${post.title} 삭제`}
                className="flex items-center justify-center size-10 md:size-11 rounded-[10px] text-textSub hover:bg-field hover:text-danger focus-visible:outline-2 focus-visible:outline-primary"
            >
                <Trash2 aria-hidden="true" className="size-4.5" />
            </button>
        </li>
    );
}

export default MyPostItem;
