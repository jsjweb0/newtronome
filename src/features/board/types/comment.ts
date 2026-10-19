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
    displayName: string | null;
    photoURL: string | null;
}

export interface MyComment extends Comment {
    postExists: boolean;
}

export interface CreateCommentInput {
    content: string;
    writerUid: string;
    displayName: string | null;
    photoURL: string | null;
}