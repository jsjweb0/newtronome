import { CommunityBoardType } from "../types/post";

export const commentQueryKeys = {
    all: ['comments'] as const,

    posts: () =>
        [...commentQueryKeys.all, 'post'] as const,

    post: (
        boardType: CommunityBoardType,
        postId: string,
    ) =>
        [
            ...commentQueryKeys.posts(),
            boardType,
            postId,
        ] as const,

    postForViewer: (
        boardType: CommunityBoardType,
        postId: string,
        viewerUid?: string | null,
    ) =>
        [
            ...commentQueryKeys.post(boardType, postId),
            'viewer',
            viewerUid ?? 'anonymous',
        ] as const,

    mineRoot: () =>
        [...commentQueryKeys.all, 'mine'] as const,

    mine: (userId: string) =>
        [...commentQueryKeys.mineRoot(), userId] as const,

    counts: () =>
        [...commentQueryKeys.all, 'count'] as const,

    count: (
        boardType: CommunityBoardType,
        postId: string,
    ) =>
        [
            ...commentQueryKeys.counts(),
            boardType,
            postId,
        ] as const,
};