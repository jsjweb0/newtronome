import {useState} from "react";
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
    increment
} from "firebase/firestore";
import {auth, db} from "../firebase";
import {PostsContext} from "./postsContextValue.js";

export function PostsProvider({children}) {
    const [postsByBoard, setPostsByBoard] = useState({});

    const convertTimestamp = (value) => {
        if (value && typeof value.toDate === 'function') {
            return value.toDate();
        }
        if (value) {
            return new Date(value);
        }
        return null;
    };

    const getPosts = async (type) => {
        if (postsByBoard[type]) return postsByBoard[type];

        const colRef = collection(db, type);
        const snapshot = await getDocs(colRef);
        const posts = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
                id: Number(docSnap.id),
                category:  data.category || null,
                ...data,
                date: convertTimestamp(data.date),
                updatedAt: convertTimestamp(data.updatedAt)
            };
        });

        setPostsByBoard((prev) => ({...prev, [type]: posts}));
        return posts;
    };

    const getPost = async (type, postId) => {
        const ref = doc(db, type, postId);
        const snap = await getDoc(ref);
        if (!snap.exists()) throw new Error("해당 문서가 없습니다.");
        const data = snap.data();
        return {
            id: Number(snap.id),
            category:  data.category || null,
            ...data,
            date: convertTimestamp(data.date),
            updatedAt: convertTimestamp(data.updatedAt)
        };
    };

    const getMyPosts = async (boardType) => {
        if (!auth.currentUser) throw new Error("로그인 필요");
        const userEmail = auth.currentUser.email;
        const q = query(
            collection(db, boardType),
            where("email", "==", userEmail),
            orderBy("date", "desc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
                id: Number(docSnap.id),
                boardType,
                ...data,
                date: convertTimestamp(data.date),
                updatedAt: convertTimestamp(data.updatedAt)
            };
        });
    };

    const createPost = async (type, post) => {
        const data = {
            title:      post.title,
            content:    post.content,
            date:       post.date instanceof Date
                ? post.date
                : new Date(post.date),
            category:   post.category,
            likeCount:  post.likeCount  ?? 0,
            likedUsers: post.likedUsers ?? [],
            authorUid:  post.authorUid,   // auth.currentUser.uid 또는 post.authorUid
            email:      post.email,       // auth.currentUser.email 또는 post.email
            displayName:  post.displayName || null,
            photoURL:     post.photoURL || null,
            ...(post.updatedAt && { updatedAt: new Date(post.updatedAt) }),
        };

        // 2) 로컬 캐시 업데이트 (optimistic UI)
        setPostsByBoard(prev => ({
            ...prev,
            [type]: [...(prev[type] || []), { id: post.id, category: post.category, ...data }]
        }));

        // 3) Firestore에 쓰기
        await setDoc(
            doc(db, type, post.id.toString()),
            data,
            { merge: true }
        );
    };

    /**
     * 특정 게시글의 일부 필드만 업데이트합니다.
     * @param {string} type      보드 타입 (e.g. "free")
     * @param {string} postId    문서 ID
     * @param {Object} fields    업데이트할 필드들
     */
    const updatePost = async (type, postId, fields) => {
        if (!auth.currentUser) throw new Error("로그인 필요");
        const ref = doc(db, type, postId.toString());
        await updateDoc(ref, fields);
        // 로컬 캐시도 갱신
        setPostsByBoard(prev => {
            const list = (prev[type] || []).map(p =>
                p.id.toString() === postId.toString() ? { ...p, category: fields.category ?? p.category, ...fields } : p
            );
            return {...prev, [type]: list};
        });
    };

    const updateViewCount = async (type, postId) => {
        const ref = doc(db, type, postId);
        await updateDoc(ref, {viewCount: increment(1)});
    };

    const deletePost = async (type, postId) => {
        const idStr = postId.toString();               // 숫자를 문자열로 변환
        await deleteDoc(doc(db, type, idStr));

        setPostsByBoard((prev) => {
            const updated = (prev[type] || []).filter((p) => p.id !== postId);
            return {...prev, [type]: updated};
        });
    };

    return (
        <PostsContext.Provider
            value={{
                getPosts,
                getPost,
                getMyPosts,
                updateViewCount,
                createPost,
                updatePost,
                deletePost
            }}
        >
            {children}
        </PostsContext.Provider>
    );
}
