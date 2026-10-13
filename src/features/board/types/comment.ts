import { CommunityBoardType } from "./post";

export interface Comment {
    id: string;
    boardType: CommunityBoardType;
    postId: string;
    content: string;
    createdAt: Date;
    likeCount: number;
    liked: boolean;
    writerUid: string | null;
    writerEmail: string | null;
    displayName: string | null;
    photoURL: string | null;
}

export interface CreateCommentInput {
    content: string;
    writerUid: string;
    writerEmail: string | null;
    displayName: string | null;
    photoURL: string | null;
}