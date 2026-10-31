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
        <div className="mt-4">
            <div className="divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden text-gray-500 text-xs md:text-base text-left md:text-center dark:border-neutral-700 dark:text-neutral-400">
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
