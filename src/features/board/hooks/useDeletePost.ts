import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CommunityBoardType, Post, } from "../types/post";
import { deletePostFromFirestore } from "../services/postsService";
import { postQueryKeys } from '../queries/postQueryKeys';
import { commentQueryKeys } from "../queries/commentQueryKeys";

export function useDeletePost(
    boardType: CommunityBoardType,
) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (postId: Post['id']) =>
            deletePostFromFirestore(boardType, postId),

        onSuccess: async (_data, postId) => {
            queryClient.removeQueries({
                queryKey: postQueryKeys.detail(boardType, postId),
            });

            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: postQueryKeys.list(boardType),
                }),
                queryClient.invalidateQueries({
                    queryKey: postQueryKeys.mineRoot(),
                }),
                queryClient.invalidateQueries({
                    queryKey: commentQueryKeys.mineRoot(),
                }),
            ]);
        },
    });
}
