import { useQuery } from '@tanstack/react-query';
import { fetchCommentCount } from '../services/commentsService';
import { commentQueryKeys } from '../queries/commentQueryKeys';
import type { CommunityBoardType } from '../types/post';

export function useCommentCountQuery(
    boardType: CommunityBoardType,
    postId: string,
) {
    return useQuery({
        queryKey: commentQueryKeys.count(boardType, postId),
        queryFn: () => fetchCommentCount(boardType, postId),
        staleTime: 60_000,
    })
}