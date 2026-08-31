import PetPostItem from "./PetPostItem";
import type { PetPost } from './PetPostItem';

type PetPostListProps = {
    filteredPosts: PetPost[];
    searchKeyword: string;
    currentPage: number;
    dateSort: boolean;
}

export default function PetPostList({
    filteredPosts,
    searchKeyword,
    currentPage,
    dateSort,
}: PetPostListProps) {

    return (
        <div className="mt-8 md:mt-6">
            <ul className="grid grid-cols-1 grid-rows-2 xl:grid-cols-4 lg:grid-cols-3 gap-8 lg:gap-4">
                {filteredPosts.map((post) => (
                    <PetPostItem
                        key={post.desertionNo}
                        post={post}
                        searchKeyword={searchKeyword}
                        currentPage={currentPage}
                        dateSort={dateSort}
                    />
                ))}
            </ul>
        </div>
    )
}
