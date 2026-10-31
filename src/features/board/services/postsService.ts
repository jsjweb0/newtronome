import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    increment,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import type {
    CommunityBoardType,
    CreatePostInput,
    Post,
    UpdatePostInput,
} from '../types/post';
import { isNonNegativeInteger } from '../../../utils/numberValidation';

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

    if (
        typeof data.title !== 'string' ||
        typeof data.content !== 'string' ||
        !authorUid
    ) {
        return null;
    }

    return {
        id: documentId,
        boardType,

        title: data.title,
        content: data.content,
        authorUid,
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

        date: convertTimestamp(data.date),
        updatedAt: convertTimestamp(data.updatedAt),

        likeCount:
            isNonNegativeInteger(data.likeCount)
                ? data.likeCount
                : 0,

        likedUsers: Array.isArray(data.likedUsers)
            ? data.likedUsers.filter(
                (user): user is string =>
                    typeof user === 'string',
            )
            : [],

        viewCount:
            isNonNegativeInteger(data.viewCount)
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
    const userUid = auth.currentUser?.uid;

    if (!userUid) {
        throw new Error('로그인 필요');
    }

    const postsQuery = query(
        collection(db, boardType),
        where('authorUid', '==', userUid),
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
): Promise<string> {
    const counterRef = doc(db, 'postCounters', boardType);

    return runTransaction(db, async (transaction) => {
        const counterSnapshot = await transaction.get(counterRef);

        if (!counterSnapshot.exists()) {
            throw new Error('게시글 번호 카운터가 없습니다.');
        }

        const current = counterSnapshot.data().current;

        if (!Number.isSafeInteger(current) || current < 0) {
            throw new Error('게시글 번호 카운터가 올바르지 않습니다.');
        }

        const nextPostNumber = current + 1;
        const postId = String(nextPostNumber);
        const postRef = doc(db, boardType, postId);

        transaction.update(counterRef, {
            current: nextPostNumber,
        });

        transaction.set(postRef, {
            title: input.title,
            content: input.content,
            date: serverTimestamp(),
            category: input.category,
            isNotice: input.isNotice === true,
            likeCount: 0,
            likedUsers: [],
            authorUid: input.authorUid,
            displayName: input.displayName,
            photoURL: input.photoURL,
        });

        return postId;
    });
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

export {
    fetchPostsFromFirestore,
    fetchPostFromFirestore,
    fetchMyPostsFromFirestore,
    createPostInFirestore,
    updatePostInFirestore,
    incrementPostViewCount,
    deletePostFromFirestore,
}