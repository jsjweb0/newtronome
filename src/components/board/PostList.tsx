import type { CommunityBoardType, Post } from '../../features/board/types/post';
import PostItem from "./PostItem";

type PostListProps = {
    posts: Post[];
    filteredPosts: Post[];
    searchKeyword: string;
    boardType: CommunityBoardType;
    currentPage: number;
    selectedCategory: string;
    dateSort: boolean;
    deletePost: (postId: Post['id']) => Promise<void>;
}

export default function PostList({
    posts,
    filteredPosts,
    searchKeyword,
    boardType,
    currentPage,
    selectedCategory,
    dateSort,
    deletePost
}: PostListProps) {
    const fixedPosts = currentPage === 1
        ? posts
            .filter(post => post.isNotice)
            .sort((a, b) => {
                const aTime = a.date?.getTime() ?? 0;
                const bTime = b.date?.getTime() ?? 0;
                return bTime - aTime || a.id.localeCompare(b.id);
            })
        : [];

    const normalPosts = filteredPosts.filter(post => !post.isNotice);
    const listItems = [...fixedPosts, ...normalPosts];

    return (
        <div role="table" aria-label="게시글 목록" className="flex flex-col">
            <div
                role="row"
                className="max-md:hidden grid grid-cols-[64px_minmax(0,1fr)_150px_96px_64px] items-center gap-x-4 px-4 min-h-10.5 border-y border-textThr text-xs font-medium text-textSub"
            >
                <span role="columnheader" className="text-center">번호</span>
                <span role="columnheader">제목</span>
                <span role="columnheader">작성자</span>
                <span role="columnheader" className="text-center">작성일</span>
                <span role="columnheader" className="text-right">조회</span>
            </div>
            <div role="rowgroup" className="max-md:border-t max-md:border-textThr">
                {listItems.map(post => (
                    <PostItem
                        key={post.id}
                        post={post}
                        searchKeyword={searchKeyword}
                        boardType={boardType}
                        currentPage={currentPage}
                        selectedCategory={selectedCategory}
                        dateSort={dateSort}
                        deletePost={deletePost}
                    />
                ))}
            </div>
        </div>
    )
}
