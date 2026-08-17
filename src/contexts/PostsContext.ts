import { createContext, useContext } from 'react';

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

  authorUid: string;
  email: string | null;
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

  authorUid: string;
  email: string | null;
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

export interface PostsContextValue {
  getPosts: (boardType: CommunityBoardType) => Promise<Post[]>;

  getPost: (boardType: CommunityBoardType, postId: string) => Promise<Post>;

  getMyPosts: (boardType: CommunityBoardType) => Promise<Post[]>;

  createPost: (boardType: CommunityBoardType, input: CreatePostInput) => Promise<Post>;

  updatePost: (
    boardType: CommunityBoardType,
    postId: string,
    input: UpdatePostInput
  ) => Promise<void>;

  updateViewCount: (boardType: CommunityBoardType, postId: string) => Promise<void>;

  deletePost: (boardType: CommunityBoardType, postId: string) => Promise<void>;
}

export const PostsContext = createContext<PostsContextValue | undefined>(undefined);

export function usePosts(): PostsContextValue {
  const context = useContext(PostsContext);

  if (!context) {
    throw new Error('usePosts는 <PostsProvider> 안에서 사용해야 해요.');
  }

  return context;
}
