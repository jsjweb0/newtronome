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
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { db } from '../firebase';

export interface Comment {
  id: string;
  boardType: string;
  postId: string;
  content: string;
  createdAt: Date;
  likeCount: number;
  liked: boolean;
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

function convertTimestamp(value: unknown): Date | null {
  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function getNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function convertCommentDocument(
  documentId: string,
  boardType: string,
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
    writerEmail: getNullableString(data.writerEmail),
    displayName: getNullableString(data.displayName),
    photoURL: getNullableString(data.photoURL),
  };
}

export async function getCommentsFromDB(
  boardType: string,
  postId: string | number,
  myUid?: string | null,
): Promise<Comment[]> {
  const normalizedPostId = postId.toString();
  const commentsRef = collection(db, boardType, normalizedPostId, 'comments');
  const q = query(commentsRef, orderBy('createdAt', 'desc'));

  const snap = await getDocs(q);
  return snap.docs.flatMap((docSnap) => {
    const comment = convertCommentDocument(
      docSnap.id,
      boardType,
      normalizedPostId,
      docSnap.data(),
      myUid,
    );

    return comment ? [comment] : [];
  });
}

export async function getCommentCountFromDB(
  boardType: string,
  postId: string | number,
): Promise<number> {
  const commentsRef = collection(db, boardType, postId.toString(), 'comments');
  const snapshot = await getCountFromServer(commentsRef);

  return snapshot.data().count;
}

export async function getMyCommentsFromDB(myUid: string): Promise<Comment[]> {
  const q = query(
    collectionGroup(db, 'comments'),
    where('writerUid', '==', myUid),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);

  return snap.docs.flatMap((docSnap) => {
    const postRef = docSnap.ref.parent.parent;

    if (!postRef) {
      return [];
    }

    const comment = convertCommentDocument(
      docSnap.id,
      postRef.parent.id,
      postRef.id,
      docSnap.data(),
      myUid,
    );

    return comment ? [comment] : [];
  });
}

export async function createCommentInDB(
  boardType: string,
  postId: string | number,
  input: CreateCommentInput,
): Promise<Comment> {
  const normalizedPostId = postId.toString();
  const createdAt = Timestamp.now();
  const data = {
    content: input.content,
    createdAt,
    likedUsers: [],
    likeCount: 0,
    writerUid: input.writerUid,
    writerEmail: input.writerEmail,
    displayName: input.displayName,
    photoURL: input.photoURL,
  };

  const documentRef = await addDoc(
    collection(db, boardType, normalizedPostId, 'comments'),
    data,
  );

  return {
    id: documentRef.id,
    boardType,
    postId: normalizedPostId,
    content: data.content,
    createdAt: createdAt.toDate(),
    likeCount: data.likeCount,
    liked: false,
    writerEmail: data.writerEmail,
    displayName: data.displayName,
    photoURL: data.photoURL,
  };
}

export async function updateCommentInDB(
  boardType: string,
  postId: string | number,
  commentId: string,
  content: string,
): Promise<void> {
  const commentRef = doc(db, boardType, postId.toString(), 'comments', commentId);

  await updateDoc(commentRef, { content });
}

export async function deleteCommentFromDB(
  boardType: string,
  postId: string | number,
  commentId: string,
): Promise<void> {
  const commentRef = doc(db, boardType, postId.toString(), 'comments', commentId);

  await deleteDoc(commentRef);
}
