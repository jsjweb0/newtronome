import { useQuery } from '@tanstack/react-query';
import type { CommunityBoardType } from '../../../contexts/PostsContext';
import { auth } from '../../../firebase';
import { fetchMyPostsFromFirestore } from '../services/postsService';
import { postQueryKeys } from '../queries/postQueryKeys';

export function useMyBoardPosts(
    userId: string,
    boardType: CommunityBoardType,
) {
    return useQuery({
        queryKey: postQueryKeys.mine(userId, boardType),

        queryFn: () => {
            if (auth.currentUser?.uid !== userId) {
                throw new Error('로그인 정보를 다시 확인해 주세요.');
            }

            return fetchMyPostsFromFirestore(boardType);
        },

        staleTime: 60_000,
    });
}