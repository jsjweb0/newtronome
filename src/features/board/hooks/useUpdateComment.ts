import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCommentInFirestore } from '../services/commentsService';
import { commentQueryKeys } from '../queries/commentQueryKeys';
import type { CommunityBoardType } from '../types/post';

type UpdateCommentVariables = {
    boardType: CommunityBoardType;
    postId: string;
    commentId: string;
    content: string;
};

export function useUpdateComment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            boardType,
            postId,
            commentId,
            content,
        }: UpdateCommentVariables) =>
            updateCommentInFirestore(
                boardType,
                postId,
                commentId,
                content,
            ),

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
            ]);
        },
    });
}