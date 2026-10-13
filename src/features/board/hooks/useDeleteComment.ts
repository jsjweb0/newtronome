import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteCommentFromFirestore } from '../services/commentsService';
import { commentQueryKeys } from '../queries/commentQueryKeys';
import type { CommunityBoardType } from '../types/post';

type DeleteCommentVariables = {
    boardType: CommunityBoardType;
    postId: string;
    commentId: string;
};

export function useDeleteComment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            boardType,
            postId,
            commentId,
        }: DeleteCommentVariables) =>
            deleteCommentFromFirestore(boardType, postId, commentId),

        onSuccess: async (_result, variables) => {
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: commentQueryKeys.post(
                        variables.boardType,
                        variables.postId,
                    ),
                }),
                queryClient.invalidateQueries({
                    queryKey: commentQueryKeys.mineRoot(),
                }),
                queryClient.invalidateQueries({
                    queryKey: commentQueryKeys.count(
                        variables.boardType,
                        variables.postId,
                    ),
                }),
            ]);
        },
    });
}