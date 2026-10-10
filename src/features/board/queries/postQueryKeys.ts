import type {
    CommunityBoardType,
    Post,
} from '../../../contexts/PostsContext';

export const postQueryKeys = {
    all: ['posts'] as const,

    lists: () =>
        [...postQueryKeys.all, 'list'] as const,

    list: (boardType: CommunityBoardType) =>
        [...postQueryKeys.lists(), boardType] as const,

    details: () =>
        [...postQueryKeys.all, 'detail'] as const,

    detail: (
        boardType: CommunityBoardType,
        postId: Post['id'],
    ) =>
        [
            ...postQueryKeys.details(),
            boardType,
            postId,
        ] as const,

    mineRoot: () =>
        [...postQueryKeys.all, 'mine'] as const,

    mine: (
        userId: string,
        boardType: CommunityBoardType,
    ) =>
        [
            ...postQueryKeys.mineRoot(),
            userId,
            boardType,
        ] as const,
};