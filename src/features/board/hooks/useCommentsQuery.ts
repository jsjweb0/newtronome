import { useQuery } from '@tanstack/react-query';
import { commentQueryKeys } from '../queries/commentQueryKeys';
import { fetchComments } from '../services/commentsService';
import type { CommunityBoardType } from '../types/post';

export function useCommentsQuery(
    boardType: CommunityBoardType,
    postId: string,
    viewerUid?: string | null,
) {
    return useQuery({
        queryKey: commentQueryKeys.postForViewer(
            boardType,
            postId,
            viewerUid,
        ),
        queryFn: () => fetchComments(boardType, postId, viewerUid),
        staleTime: 60_000,
    });
}