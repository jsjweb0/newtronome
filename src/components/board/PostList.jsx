import PostItem from "./PostItem.jsx";

export default function PostList({ posts, filteredPosts, setPosts, searchKeyword, boardType, currentPage, dateSort, deletePost }) {
    const fixedPosts = currentPage === 1
        ? posts.filter(p => p.isNotice).sort((a, b) => b.id - a.id)
        : [];

    const normalPosts = filteredPosts.filter(p => !p.isNotice);
    const sortedPosts = [...fixedPosts, ...normalPosts];

    return (
            <div className="mt-4">
                <div className="divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden text-gray-500 text-xs md:text-base text-left md:text-center dark:border-neutral-700 dark:text-neutral-400">
                    {sortedPosts.map((post) => (
                        <PostItem key={post.uid || `${boardType}-${post.id}-${post.date}`}
                                  post={post}
                                  posts={posts}
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