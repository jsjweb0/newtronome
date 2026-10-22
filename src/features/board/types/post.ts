export const COMMUNITY_BOARD_TYPES = ['notice', 'free'] as const;

export type CommunityBoardType = (typeof COMMUNITY_BOARD_TYPES)[number];

export function isCommunityBoardType(value: string | undefined): value is CommunityBoardType {
    return COMMUNITY_BOARD_TYPES.some((boardType) => boardType === value);
}

export interface Post {
    id: string;
    boardType: CommunityBoardType;

    title: string;
    content: string;

    authorUid: string | null;
    displayName: string | null;
    photoURL: string | null;

    category: string | null;
    postNo: number | null;

    date: Date | null;
    updatedAt: Date | null;

    likeCount: number;
    likedUsers: string[];
    viewCount: number;

    isNotice: boolean;
    __viewed?: boolean;
}

export interface CreatePostInput {
    title: string;
    content: string;
    postNo: number;
    date: Date;
    category: string | null;
    isNotice: boolean;

    authorUid: string;
    displayName: string | null;
    photoURL: string | null;
}

export interface UpdatePostInput {
    title?: string;
    content?: string;
    category?: string | null;
    isNotice?: boolean;
    updatedAt?: Date | string;
}