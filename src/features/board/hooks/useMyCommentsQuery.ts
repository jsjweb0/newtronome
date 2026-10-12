import { useQuery } from '@tanstack/react-query';
import { commentQueryKeys } from '../queries/commentQueryKeys';
import { fetchMyComments } from '../services/commentsService';

export function useMyCommentsQuery(userId: string) {
    return useQuery({
        queryKey: commentQueryKeys.mine(userId),
        queryFn: () => fetchMyComments(userId),
        staleTime: 60_000,
    });
}