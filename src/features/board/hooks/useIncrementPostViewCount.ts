import {
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import type { CommunityBoardType, Post } from '../types/post';
import { incrementPostViewCount } from '../services/postsService';
import { postQueryKeys } from '../queries/postQueryKeys';

export function useIncrementPostViewCount(
    boardType: CommunityBoardType,
    postId: Post['id'],
) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => incrementPostViewCount(boardType, postId),

        onSuccess: () => {
            queryClient.setQueryData<Post>(
                postQueryKeys.detail(boardType, postId),
                (post) =>
                    post
                        ? {
                            ...post,
                            viewCount: post.viewCount + 1,
                            __viewed: true,
                        }
                        : post,
            );

            queryClient.setQueryData<Post[]>(
                postQueryKeys.list(boardType),
                (posts) =>
                    posts?.map((post) =>
                        post.id === postId
                            ? {
                                ...post,
                                viewCount: post.viewCount + 1,
                            }
                            : post,
                    ),
            );
        },

    });
}
