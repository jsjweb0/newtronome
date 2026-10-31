import {
    addDoc,
    collection,
    collectionGroup,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
    getCountFromServer,
    orderBy,
    Timestamp,
    updateDoc,
    getDoc,
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { db } from '../../../firebase';
import { convertTimestamp } from '../utils/convertTimestamp';
import type {
    Comment,
    CreateCommentInput,
    MyComment,
} from '../types/comment';
import type { CommunityBoardType } from '../types/post';

function getNullableString(value: unknown): string | null {
    return typeof value === 'string' && value.length > 0 ? value : null;
}

function convertCommentDocument(
    documentId: string,
    boardType: CommunityBoardType,
    postId: string,
    data: DocumentData,
    myUid?: string | null,
): Comment | null {
    const createdAt = convertTimestamp(data.createdAt);

    if (typeof data.content !== 'string' || !createdAt) {
        return null;
    }

    const likedUsers = Array.isArray(data.likedUsers)
        ? data.likedUsers.filter((user): user is string => typeof user === 'string')
        : [];

    return {
        id: documentId,
        boardType,
        postId,
        content: data.content,
        createdAt,
        likeCount: typeof data.likeCount === 'number' && Number.isFinite(data.likeCount)
            ? data.likeCount
            : 0,
        liked: typeof myUid === 'string' && likedUsers.includes(myUid),
        writerUid: getNullableString(data.writerUid),
        displayName: getNullableString(data.displayName),
        photoURL: getNullableString(data.photoURL),
    };
}

export async function fetchComments(
    boardType: CommunityBoardType,
    postId: string,
    viewerUid?: string | null,
): Promise<Comment[]> {
    const commentsRef = collection(
        db,
        boardType,
        postId,
        'comments'
    );

    const commentsQuery = query(
        commentsRef,
        orderBy('createdAt', 'desc'),
    );

    const snapshot = await getDocs(commentsQuery);

    return snapshot.docs.flatMap((documentSnapshot) => {
        const comment = convertCommentDocument(
            documentSnapshot.id,
            boardType,
            postId,
            documentSnapshot.data(),
            viewerUid,
        );

        return comment ? [comment] : [];
    });
}

export async function fetchMyComments(
    userId: string
): Promise<MyComment[]> {
    const commentsQuery = query(
        collectionGroup(db, 'comments'),
        where('writerUid', '==', userId),
        orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(commentsQuery);

    const commentsWithPostReference = snapshot.docs.flatMap(
        (documentSnapshot) => {
            const postReference =
                documentSnapshot.ref.parent.parent;

            if (!postReference) {
                return [];
            }

            const boardType = postReference.parent.id;

            if (
                boardType !== 'notice' &&
                boardType !== 'free'
            ) {
                return [];
            }

            const comment = convertCommentDocument(
                documentSnapshot.id,
                boardType,
                postReference.id,
                documentSnapshot.data(),
                userId,
            );

            return comment
                ? [{ comment, postReference }]
                : [];
        }
    );

    // 같은 게시글에 댓글이 여러 개 있어도 부모 글은 한 번만 조회
    const uniquePostReferences = new Map(
        commentsWithPostReference.map(
            ({ postReference }) => [
                postReference.path,
                postReference,
            ]
        )
    );

    const postExistenceEntries = await Promise.all(
        [...uniquePostReferences.entries()].map(
            async ([path, postReference]) => {
                const postSnapshot = await getDoc(postReference);

                return [
                    path,
                    postSnapshot.exists(),
                ] as const;
            }
        )
    );

    const postExistsByPath = new Map(
        postExistenceEntries
    );

    return commentsWithPostReference.map(
        ({ comment, postReference }) => ({
            ...comment,
            postExists:
                postExistsByPath.get(postReference.path) === true,
        })
    );
}

export async function createCommentInFirestore(
    boardType: CommunityBoardType,
    postId: string,
    input: CreateCommentInput,
): Promise<Comment> {
    const createdAt = Timestamp.now();
    const data = {
        content: input.content,
        createdAt,
        likedUsers: [],
        likeCount: 0,
        writerUid: input.writerUid,
        displayName: input.displayName,
        photoURL: input.photoURL,
    };

    const documentRef = await addDoc(
        collection(
            db,
            boardType,
            postId,
            'comments'
        ),
        data,
    );

    return {
        id: documentRef.id,
        boardType,
        postId,
        content: data.content,
        createdAt: createdAt.toDate(),
        likeCount: data.likeCount,
        liked: false,
        writerUid: data.writerUid,
        displayName: data.displayName,
        photoURL: data.photoURL,
    };
}

export async function updateCommentInFirestore(
    boardType: CommunityBoardType,
    postId: string,
    commentId: string,
    content: string,
): Promise<void> {
    const commentRef = doc(
        db,
        boardType,
        postId,
        'comments',
        commentId
    );

    await updateDoc(commentRef, { content });
}

export async function deleteCommentFromFirestore(
    boardType: CommunityBoardType,
    postId: string,
    commentId: string,
): Promise<void> {
    const commentRef = doc(
        db,
        boardType,
        postId,
        'comments',
        commentId
    );

    await deleteDoc(commentRef);
}

export async function fetchCommentCount(
    boardType: CommunityBoardType,
    postId: string,
): Promise<number> {
    const commentsRef = collection(
        db,
        boardType,
        postId,
        'comments'
    );

    const snapshot = await getCountFromServer(commentsRef);

    return snapshot.data().count;
}