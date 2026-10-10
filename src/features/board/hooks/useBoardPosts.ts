import { useQuery } from "@tanstack/react-query";
import type { CommunityBoardType } from "../../../contexts/PostsContext";
import { fetchPostsFromFirestore } from "../services/postsService";
import { postQueryKeys } from '../queries/postQueryKeys';

export function useBoardPosts(
    boardType: CommunityBoardType,
) {
    return useQuery({
        queryKey: postQueryKeys.list(boardType),
        queryFn: () => fetchPostsFromFirestore(boardType),
        staleTime: 60_000,
    })
}