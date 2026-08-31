import type { Dispatch, SetStateAction } from 'react';
import type {
    CommunityBoardType,
    Post,
} from '../../contexts/PostsContext';
import PostItem from "./PostItem";

type PostListProps = {
    posts: Post[];
    filteredPosts: Post[];
    setPosts: Dispatch<SetStateAction<Post[]>>;
    searchKeyword: string;
    boardType: CommunityBoardType;
    currentPage: number;
    dateSort: boolean;
    deletePost: (postId: Post['id']) => Promise<void>;
}

export default function PostList({
    posts,
    filteredPosts,
    setPosts,
    searchKeyword,
    boardType,
    currentPage,
    dateSort,
    deletePost
}: PostListProps) {
    const fixedPosts = currentPage === 1
        ? posts
            .filter(p => p.isNotice)
            .sort((a, b) => (Number(b.postNo) || 0) - (Number(a.postNo) || 0))
        : [];

    const normalPosts = filteredPosts.filter(p => !p.isNotice);
    const sortedPosts = [...fixedPosts, ...normalPosts];

    return (
        <div className="mt-4">
            <div className="divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden text-gray-500 text-xs md:text-base text-left md:text-center dark:border-neutral-700 dark:text-neutral-400">
                {sortedPosts.map((post) => (
                    <PostItem
                        key={post.id}
                        post={post}
                        setPosts={setPosts}
                        searchKeyword={searchKeyword}
                        boardType={boardType}
                        currentPage={currentPage}
                        dateSort={dateSort}
                        deletePost={deletePost}
                    />
                ))}
            </div>
        </div>
    )
}
