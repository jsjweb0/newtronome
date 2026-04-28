import { collection, collectionGroup, getDocs, query, where, getCountFromServer, orderBy } from "firebase/firestore";
import { db } from "../firebase";

/**
 * 특정 게시글의 댓글 목록을 불러옵니다.
 *
 * @param {string} boardType  컬렉션명 (e.g. "free")
 * @param {string|number} postId    문서ID (숫자여도 toString() 처리)
 * @param {string} myUid     내 uid (좋아요 표시용)
 */
export async function getCommentsFromDB(boardType, postId, myUid) {
    const commentsRef = collection(
        db,
        boardType,
        postId.toString(),
        "comments"
    );
    const q = query(
        commentsRef,
        orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);
    return snap.docs.map(docSnap => {
        const data = docSnap.data();
        return {
            id:        docSnap.id,
            boardType,
            postId:    Number(postId),       // 인자로 받은 postId
            content:   data.content,
            createdAt: data.createdAt.toDate(),
            likeCount: data.likeCount || 0,
            liked:     data.likedUsers?.includes(myUid) || false,
            writerEmail: data.writerEmail || null,
            displayName: data.displayName || null,
            photoURL:    data.photoURL    || null,
        };
    });
}

export async function getCommentCountFromDB(boardType, postId) {
    const commentsRef = collection(
        db,
        boardType,
        postId.toString(),
        "comments"
    );
    const snapshot = await getCountFromServer(commentsRef);

    return snapshot.data().count;
}

/**
 * Fetch all comments written by a given user (across every boardType/postId).
 *
 * @param {string} myUid  The current user's UID.
 * @returns {Promise<Array<{
 *   id: string,
 *   boardType: string,
 *   postId: number,
 *   content: string,
 *   createdAt: Date,
 *   likeCount: number,
 *   liked: boolean
 * }>>}
 */
export async function getMyCommentsFromDB(myUid) {
    // 1) collectionGroup으로 모든 comments 서브컬렉션 순회
    const q = query(
        collectionGroup(db, "comments"),
        where("writerUid", "==", myUid),
        orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);

    return snap.docs.map(docSnap => {
        const data = docSnap.data();

        // comment가 속한 postId, boardType을 경로(ref)에서 추출
        const postRef = docSnap.ref.parent.parent;       // comments 컬렉션의 부모가 post 문서
        const boardType = postRef.parent.id;             // 그 post 문서의 부모 컬렉션 ID가 boardType
        const postId = Number(postRef.id);

        return {
            id:        docSnap.id,
            boardType,
            postId,
            content:   data.content,
            createdAt: data.createdAt.toDate(),        // Timestamp → Date
            likeCount: data.likeCount || 0,
            liked:     data.likedUsers?.includes(myUid) || false,
        };
    });
}