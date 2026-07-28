import { useCallback, useMemo, useRef } from 'react';
import {
  collection,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  increment,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { PostsContext } from './postsContextValue.js';

const getPostNumber = (data, documentId) => {
  const postNumber = Number(data.postNo ?? documentId);
  return Number.isFinite(postNumber) ? postNumber : null;
};

const convertTimestamp = (value) => {
  if (value && typeof value.toDate === 'function') {
    return value.toDate();
  }

  if (value) {
    return new Date(value);
  }

  return null;
};

export function PostsProvider({ children }) {
  const postsByBoardRef = useRef({});

  const getPosts = useCallback(async (type) => {
    const cachedPosts = postsByBoardRef.current[type];

    if (cachedPosts) {
      return cachedPosts;
    }

    const colRef = collection(db, type);
    const snapshot = await getDocs(colRef);

    const posts = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();

      return {
        id: docSnap.id,
        postNo: getPostNumber(data, docSnap.id),
        category: data.category || null,
        ...data,
        date: convertTimestamp(data.date),
        updatedAt: convertTimestamp(data.updatedAt),
      };
    });

    postsByBoardRef.current = {
      ...postsByBoardRef.current,
      [type]: posts,
    };

    return posts;
  }, []);

  const getPost = useCallback(async (type, postId) => {
    const ref = doc(db, type, postId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('해당 문서가 없습니다.');
    const data = snap.data();
    return {
      id: snap.id,
      postNo: getPostNumber(data, snap.id),
      category: data.category || null,
      ...data,
      date: convertTimestamp(data.date),
      updatedAt: convertTimestamp(data.updatedAt),
    };
  }, []);

  const getMyPosts = useCallback(async (boardType) => {
    if (!auth.currentUser) {
      throw new Error('로그인 필요');
    }

    const userEmail = auth.currentUser.email;
    const postsQuery = query(
      collection(db, boardType),
      where('email', '==', userEmail),
      orderBy('date', 'desc')
    );

    const snapshot = await getDocs(postsQuery);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();

      return {
        id: docSnap.id,
        postNo: getPostNumber(data, docSnap.id),
        boardType,
        ...data,
        date: convertTimestamp(data.date),
        updatedAt: convertTimestamp(data.updatedAt),
      };
    });
  }, []);

  const createPost = useCallback(async (type, post) => {
    const postRef = doc(collection(db, type));

    const data = {
      title: post.title,
      content: post.content,
      postNo: post.postNo,
      date: post.date instanceof Date ? post.date : new Date(post.date),
      category: post.category,
      likeCount: 0,
      likedUsers: [],
      authorUid: post.authorUid,
      email: post.email,
      displayName: post.displayName || null,
      photoURL: post.photoURL || null,
    };

    await setDoc(postRef, data);

    const createdPost = {
      id: postRef.id,
      ...data,
    };

    postsByBoardRef.current = {
      ...postsByBoardRef.current,
      [type]: [...(postsByBoardRef.current[type] || []), createdPost],
    };

    return createdPost;
  }, []);

  /**
   * 특정 게시글의 일부 필드만 업데이트합니다.
   * @param {string} type
   * @param {string} postId
   * @param {Object} fields
   */
  const updatePost = useCallback(async (type, postId, fields) => {
    if (!auth.currentUser) {
      throw new Error('로그인 필요');
    }

    const ref = doc(db, type, postId.toString());
    await updateDoc(ref, fields);

    const list = (postsByBoardRef.current[type] || []).map((post) =>
      post.id.toString() === postId.toString()
        ? {
            ...post,
            category: fields.category ?? post.category,
            ...fields,
          }
        : post
    );

    postsByBoardRef.current = {
      ...postsByBoardRef.current,
      [type]: list,
    };
  }, []);

  const updateViewCount = useCallback(async (type, postId) => {
    const ref = doc(db, type, postId);
    await updateDoc(ref, { viewCount: increment(1) });
  }, []);

  const deletePost = useCallback(async (type, postId) => {
    const id = postId.toString();
    await deleteDoc(doc(db, type, id));

    const updatedPosts = (postsByBoardRef.current[type] || []).filter(
      (post) => post.id.toString() !== id
    );

    postsByBoardRef.current = {
      ...postsByBoardRef.current,
      [type]: updatedPosts,
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      getPosts,
      getPost,
      getMyPosts,
      updateViewCount,
      createPost,
      updatePost,
      deletePost,
    }),
    [getPosts, getPost, getMyPosts, updateViewCount, createPost, updatePost, deletePost]
  );

  return <PostsContext.Provider value={contextValue}>{children}</PostsContext.Provider>;
}
