import { useCallback, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { PostsContext } from './PostsContext';
import type {
    CommunityBoardType,
    Post,
    PostsContextValue,
} from './PostsContext';

import {
    fetchPostsFromFirestore,
    fetchPostFromFirestore,
    fetchMyPostsFromFirestore,
    createPostInFirestore,
    updatePostInFirestore,
    incrementPostViewCount,
    deletePostFromFirestore,
} from '../features/board/services/postsService';

interface PostsProviderProps {
    children: ReactNode;
}

type PostsByBoard = Partial<
    Record<CommunityBoardType, Post[]>
>;

export function PostsProvider({
    children,
}: PostsProviderProps) {
    const postsByBoardRef = useRef<PostsByBoard>({});

    const boardVersionsRef = useRef<
        Partial<Record<CommunityBoardType, number>>
    >({});

    const invalidateBoardCache = useCallback(
        (boardType: CommunityBoardType) => {
            const currentVersion =
                boardVersionsRef.current[boardType] ?? 0;

            boardVersionsRef.current[boardType] =
                currentVersion + 1;

            delete postsByBoardRef.current[boardType];
        },
        []
    );

    const getPosts = useCallback<
        PostsContextValue['getPosts']
    >(async (boardType) => {
        while (true) {
            const cachedPosts =
                postsByBoardRef.current[boardType];

            if (cachedPosts !== undefined) {
                return cachedPosts;
            }

            const requestVersion =
                boardVersionsRef.current[boardType] ?? 0;

            const posts =
                await fetchPostsFromFirestore(boardType);

            const currentVersion =
                boardVersionsRef.current[boardType] ?? 0;

            if (requestVersion !== currentVersion) {
                continue;
            }

            postsByBoardRef.current[boardType] = posts;

            return posts;
        }
    }, []);

    const getPost = useCallback<
        PostsContextValue['getPost']
    >(
        (boardType, postId) =>
            fetchPostFromFirestore(boardType, postId),
        [],
    );

    const getMyPosts = useCallback<
        PostsContextValue['getMyPosts']
    >(
        (boardType) =>
            fetchMyPostsFromFirestore(boardType),
        [],
    );

    const createPost = useCallback<
        PostsContextValue['createPost']
    >(async (boardType, input) => {
        const createdPost =
            await createPostInFirestore(boardType, input);

        invalidateBoardCache(boardType);

        return createdPost;
    }, [invalidateBoardCache]);

    const updatePost = useCallback<
        PostsContextValue['updatePost']
    >(async (boardType, postId, input) => {
        await updatePostInFirestore(
            boardType,
            postId,
            input
        );

        invalidateBoardCache(boardType);
    }, [invalidateBoardCache]);

    const updateViewCount = useCallback<
        PostsContextValue['updateViewCount']
    >(
        (boardType, postId) =>
            incrementPostViewCount(boardType, postId),
        [],
    );

    const deletePost = useCallback<
        PostsContextValue['deletePost']
    >(async (boardType, postId) => {
        await deletePostFromFirestore(boardType, postId);

        invalidateBoardCache(boardType);
    }, [invalidateBoardCache]);

    const contextValue = useMemo<PostsContextValue>(
        () => ({
            getPosts,
            getPost,
            getMyPosts,
            createPost,
            updatePost,
            updateViewCount,
            deletePost,
        }),
        [
            getPosts,
            getPost,
            getMyPosts,
            createPost,
            updatePost,
            updateViewCount,
            deletePost,
        ],
    );

    return (
        <PostsContext.Provider value={contextValue}>
            {children}
        </PostsContext.Provider>
    );
}
