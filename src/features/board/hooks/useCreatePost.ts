import {
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import type {
    CommunityBoardType,
    CreatePostInput,
} from '../../../contexts/PostsContext';
import { createPostInFirestore } from '../services/postsService';
import { postQueryKeys } from '../queries/postQueryKeys';

type CreatePostVariables = {
    boardType: CommunityBoardType;
    input: CreatePostInput;
};

export function useCreatePost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            boardType,
            input,
        }: CreatePostVariables) => createPostInFirestore(boardType, input),

        onSuccess: async (_createdPost, variables) => {
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: postQueryKeys.list(variables.boardType),
                }),
                queryClient.invalidateQueries({
                    queryKey: postQueryKeys.mineRoot(),
                }),
            ]);
        },
    });
}