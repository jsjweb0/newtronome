import {
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import type {
    CommunityBoardType,
    Post,
    UpdatePostInput,
} from '../../../contexts/PostsContext';
import { updatePostInFirestore } from '../services/postsService';
import { postQueryKeys } from '../queries/postQueryKeys';

type UpdatePostVariables = {
    boardType: CommunityBoardType;
    postId: Post['id'];
    input: UpdatePostInput;
};

export function useUpdatePost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            boardType,
            postId,
            input,
        }: UpdatePostVariables) =>
            updatePostInFirestore(
                boardType,
                postId,
                input,
            ),

        onSuccess: async (_data, variables) => {
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: postQueryKeys.list(variables.boardType),
                }),
                queryClient.invalidateQueries({
                    queryKey: postQueryKeys.detail(variables.boardType, variables.postId),
                }),
                queryClient.invalidateQueries({
                    queryKey: postQueryKeys.mineRoot(),
                })
            ]);
        },
    });
}
