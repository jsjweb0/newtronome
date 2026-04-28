import PetPostItem from "./PetPostItem.jsx";

export default function PetPostList({
                                        filteredPosts,
                                        setPosts,
                                        searchKeyword,
                                        currentPage,
                                        dateSort,
                                    }) {

    return (
        <div className="mt-8 md:mt-6">
            <ul className="grid grid-cols-1 grid-rows-2 xl:grid-cols-4 lg:grid-cols-3 gap-8 lg:gap-4">
                {filteredPosts.map((post) => (
                    <PetPostItem key={post.desertionNo}
                                 post={post}
                                 posts={filteredPosts}
                                 setPosts={setPosts}
                                 searchKeyword={searchKeyword}
                                 currentPage={currentPage}
                                 dateSort={dateSort}
                    />
                ))}
            </ul>
        </div>
    )
}
