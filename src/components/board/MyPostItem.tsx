import { Link } from "react-router-dom";
import { BaseButton } from "../ui/BaseButton";
import { formatDate } from "../../utils/format";
import type { Post } from "../../features/board/types/post";
import { useCommentCountQuery } from '../../features/board/hooks/useCommentCountQuery';

type MyPostItemProps = {
    post: Post;
    idx: number;
    onDelete: () => Promise<void>;
};

function MyPostItem({
    post,
    idx,
    onDelete
}: MyPostItemProps) {
    const commentCountQuery = useCommentCountQuery(
        post.boardType,
        post.id,
    );
    const commentCount = commentCountQuery.data;

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 md:gap-2 px-4 py-3 text-xs md:text-base sm:items-center hover:bg-gray-50 dark:hover:bg-neutral-800 dark:border-neutral-700">
            {/* 게시글 번호 */}
            <div className="md:col-span-2 flex gap-2">
                <div className="md:grow">{idx}</div>
                <div className="w-2/3">
                    {post.boardType === "free" ? "자유게시판" : "공지사항"}
                </div>
            </div>

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
                    {commentCount !== undefined && commentCount > 0 && (
                        <i className="shrink-0 inline-block not-italic text-xs text-gray-500 px-2">
                            {commentCount}
                        </i>
                    )}

                    {commentCount === undefined && (
                        <span className="shrink-0 px-2 text-xs text-textSub">
                            <i aria-hidden="true">—</i>
                            <i className="sr-only">
                                {commentCountQuery.isError
                                    ? '댓글 수를 불러오지 못했습니다.'
                                    : '댓글 수를 불러오는 중입니다.'}
                            </i>
                        </span>
                    )}
                </Link>
            </div>

            {/* 작성일 */}
            <div className="md:col-span-2">{formatDate(post.date)}</div>

            {/* 삭제 버튼 */}
            <div className="md:col-span-1 max-md:mt-2">
                <BaseButton
                    variant="cancel"
                    className="px-3! py-1! min-w-max"
                    onClick={onDelete}
                >
                    삭제
                </BaseButton>
            </div>
        </div>
    );
}

export default MyPostItem;
