import { useQuery } from '@tanstack/react-query';
import type { CommunityBoardType, Post } from '../../../contexts/PostsContext';
import { fetchPostFromFirestore } from '../services/postsService';
import { postQueryKeys } from '../queries/postQueryKeys';

export function useBoardPost(
    boardType: CommunityBoardType,
    postId: Post['id'],
) {
    return useQuery({
        queryKey: postQueryKeys.detail(boardType, postId),
        queryFn: () => fetchPostFromFirestore(boardType, postId),
        staleTime: 60_000,
    });
}
