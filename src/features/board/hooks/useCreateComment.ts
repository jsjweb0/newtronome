import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCommentInFirestore } from '../services/commentsService';
import { commentQueryKeys } from '../queries/commentQueryKeys';
import type { CommunityBoardType } from '../types/post';
import type { CreateCommentInput } from '../types/comment';

type CreateCommentVariables = {
    boardType: CommunityBoardType;
    postId: string;
    input: CreateCommentInput;
};

export function useCreateComment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            boardType,
            postId,
            input,
        }: CreateCommentVariables) =>
            createCommentInFirestore(boardType, postId, input),

        onSuccess: async (_createdComment, variables) => {
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