import { useCallback, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    increment,
    orderBy,
    query,
    setDoc,
    Timestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { PostsContext } from './PostsContext';
import type {
    CommunityBoardType,
    CreatePostInput,
    Post,
    PostsContextValue,
    UpdatePostInput,
} from './PostsContext';

function getPostNumber(
    data: DocumentData,
    documentId: string,
): number | null {
    const postNumber = Number(data.postNo ?? documentId);

    return Number.isFinite(postNumber)
        ? postNumber
        : null;
}

function convertTimestamp(value: unknown): Date | null {
    if (value instanceof Timestamp) {
        return value.toDate();
    }

    if (value instanceof Date) {
        return Number.isNaN(value.getTime())
            ? null
            : value;
    }

    if (
        typeof value === 'string' ||
        typeof value === 'number'
    ) {
        const date = new Date(value);

        return Number.isNaN(date.getTime())
            ? null
            : date;
    }

    return null;
}

function convertPostDocument(
    documentId: string,
    boardType: CommunityBoardType,
    data: DocumentData,
): Post | null {
    const authorUid =
        typeof data.authorUid === 'string' &&
            data.authorUid.length > 0
            ? data.authorUid
            : null;
    const email =
        typeof data.email === 'string' &&
            data.email.length > 0
            ? data.email
            : null;

    if (
        typeof data.title !== 'string' ||
        typeof data.content !== 'string' ||
        (!authorUid && !email)
    ) {
        return null;
    }

    return {
        id: documentId,
        boardType,

        title: data.title,
        content: data.content,
        authorUid,
        email,
        displayName:
            typeof data.displayName === 'string'
                ? data.displayName
                : null,
        photoURL:
            typeof data.photoURL === 'string'
                ? data.photoURL
                : null,

        category:
            typeof data.category === 'string' &&
                data.category.length > 0
                ? data.category
                : null,

        postNo: getPostNumber(data, documentId),
        date: convertTimestamp(data.date),
        updatedAt: convertTimestamp(data.updatedAt),

        likeCount:
            typeof data.likeCount === 'number'
                ? data.likeCount
                : 0,

        likedUsers: Array.isArray(data.likedUsers)
            ? data.likedUsers.filter(
                (user): user is string =>
                    typeof user === 'string',
            )
            : [],

        viewCount:
            typeof data.viewCount === 'number'
                ? data.viewCount
                : 0,

        isNotice:
            typeof data.isNotice === 'boolean'
                ? data.isNotice
                : false,
    };
}

async function fetchPostsFromFirestore(
    boardType: CommunityBoardType,
): Promise<Post[]> {
    const collectionRef = collection(db, boardType);
    const snapshot = await getDocs(collectionRef);

    return snapshot.docs.flatMap((documentSnapshot) => {
        const post = convertPostDocument(
            documentSnapshot.id,
            boardType,
            documentSnapshot.data(),
        );

        return post ? [post] : [];
    });
}

async function fetchPostFromFirestore(
    boardType: CommunityBoardType,
    postId: string,
): Promise<Post> {
    const documentRef = doc(db, boardType, postId);
    const documentSnapshot = await getDoc(documentRef);

    if (!documentSnapshot.exists()) {
        throw new Error('해당 문서가 없습니다.');
    }

    const post = convertPostDocument(
        documentSnapshot.id,
        boardType,
        documentSnapshot.data(),
    );

    if (!post) {
        throw new Error('게시글 데이터 형식이 올바르지 않습니다.');
    }

    return post;
}

async function fetchMyPostsFromFirestore(
    boardType: CommunityBoardType,
): Promise<Post[]> {
    const userEmail = auth.currentUser?.email;

    if (!userEmail) {
        throw new Error('로그인 필요');
    }

    const postsQuery = query(
        collection(db, boardType),
        where('email', '==', userEmail),
        orderBy('date', 'desc'),
    );

    const snapshot = await getDocs(postsQuery);

    return snapshot.docs.flatMap((documentSnapshot) => {
        const post = convertPostDocument(
            documentSnapshot.id,
            boardType,
            documentSnapshot.data(),
        );

        return post ? [post] : [];
    });
}

async function createPostInFirestore(
    boardType: CommunityBoardType,
    input: CreatePostInput,
): Promise<Post> {
    const postRef = doc(collection(db, boardType));

    const data = {
        title: input.title,
        content: input.content,
        postNo: input.postNo,
        date: input.date,
        category: input.category,
        likeCount: 0,
        likedUsers: [],
        authorUid: input.authorUid,
        email: input.email,
        displayName: input.displayName,
        photoURL: input.photoURL,
    };

    await setDoc(postRef, data);

    return {
        id: postRef.id,
        boardType,
        ...data,
        updatedAt: null,
        viewCount: 0,
        isNotice: false,
    };
}

async function updatePostInFirestore(
    boardType: CommunityBoardType,
    postId: string,
    input: UpdatePostInput,
): Promise<void> {
    if (!auth.currentUser) {
        throw new Error('로그인 필요');
    }

    const postRef = doc(db, boardType, postId);

    await updateDoc(postRef, { ...input });
}

async function incrementPostViewCount(
    boardType: CommunityBoardType,
    postId: string,
): Promise<void> {
    const postRef = doc(db, boardType, postId);

    await updateDoc(postRef, {
        viewCount: increment(1),
    });
}

async function deletePostFromFirestore(
    boardType: CommunityBoardType,
    postId: string,
): Promise<void> {
    const postRef = doc(db, boardType, postId);

    await deleteDoc(postRef);
}

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

    const getPosts = useCallback<
        PostsContextValue['getPosts']
    >(async (boardType) => {
        const cachedPosts =
            postsByBoardRef.current[boardType];

        if (cachedPosts) {
            return cachedPosts;
        }

        const posts =
            await fetchPostsFromFirestore(boardType);

        postsByBoardRef.current = {
            ...postsByBoardRef.current,
            [boardType]: posts,
        };

        return posts;
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

        postsByBoardRef.current = {
            ...postsByBoardRef.current,
            [boardType]: [
                ...(postsByBoardRef.current[boardType] ?? []),
                createdPost,
            ],
        };

        return createdPost;
    }, []);

    const updatePost = useCallback<
        PostsContextValue['updatePost']
    >(async (boardType, postId, input) => {
        await updatePostInFirestore(
            boardType,
            postId,
            input,
        );

        const updatedPosts = (
            postsByBoardRef.current[boardType] ?? []
        ).map((post) => {
            if (post.id !== postId) {
                return post;
            }

            return {
                ...post,
                ...input,
                updatedAt:
                    input.updatedAt === undefined
                        ? post.updatedAt
                        : convertTimestamp(input.updatedAt),
            };
        });

        postsByBoardRef.current = {
            ...postsByBoardRef.current,
            [boardType]: updatedPosts,
        };
    }, []);

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
        await deletePostFromFirestore(
            boardType,
            postId,
        );

        const updatedPosts = (
            postsByBoardRef.current[boardType] ?? []
        ).filter((post) => post.id !== postId);

        postsByBoardRef.current = {
            ...postsByBoardRef.current,
            [boardType]: updatedPosts,
        };
    }, []);

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
