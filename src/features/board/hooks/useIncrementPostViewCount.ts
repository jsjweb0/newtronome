import {
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import type { CommunityBoardType, Post } from '../types/post';
import { incrementPostViewCount } from '../services/postsService';
import { postQueryKeys } from '../queries/postQueryKeys';

interface ViewCountTarget {
    boardType: CommunityBoardType;
    postId: Post['id'];
}

export function useIncrementPostViewCount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ boardType, postId }: ViewCountTarget) =>
            incrementPostViewCount(boardType, postId),

        onSuccess: (_data, { boardType, postId }) => {
            queryClient.setQueryData<Post>(
                postQueryKeys.detail(boardType, postId),
                (post) =>
                    post
                        ? {
                            ...post,
                            viewCount: post.viewCount + 1,
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
