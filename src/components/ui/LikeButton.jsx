import {useEffect, useMemo, useState} from 'react';
import {Heart, ThumbsUp} from 'lucide-react';
import {
    doc,
    onSnapshot,
    setDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    increment
} from 'firebase/firestore';
import {db} from '../../firebase';
import {useAuth} from '../../contexts/AuthContext.jsx';
import {useToast} from '../../contexts/ToastContext.jsx';
import clsx from "clsx";
import {useNotifications} from "../../contexts/NotificationContext.jsx";

export default function LikeButton({
                                       type = 'heart',
                                       collection,
                                       docId,           // 문서 ID (포스트ID 또는 댓글ID)
                                       parentId,        // 댓글일 때만 필요
                                       subCollection,   // 댓글일 때만 "comments"
                                       showCount = true,
                                       className,
                                       svgClassName
                                   }) {
    const {user} = useAuth();
    const {addNotification} = useNotifications();
    const {showToast} = useToast();
    const [liked, setLiked] = useState(false);
    const [count, setCount] = useState(0);
    const [animate, setAnimate] = useState(false);

    const commentDocId = String(docId);

    const segments = subCollection && parentId
        ? [collection, String(parentId), subCollection, commentDocId]
        : [collection, String(docId)];

    const docRef = doc(db, ...segments);
    //console.log('[LikeButton] docRef.path →', docRef.path);

    useEffect(() => {
        if (!user) {
            setCount(0);
            setLiked(false);
            return;
        }
        const unsub = onSnapshot(docRef, snap => {
            const data = snap.data() || {};
            setCount(data.likeCount || 0);
            setLiked(data.likedUsers?.includes(user.uid)   ?? false);
        }, console.error);
        return unsub;
    }, [docRef, user]);

    const handleLike = async () => {
        if (!user) {
            showToast({ message: '로그인 후 이용해 주세요!', type: 'info' });
            return;
        }
        const newLiked = !liked;
        setLiked(newLiked);
        setCount(c => c + (newLiked?1:-1));
        setAnimate(true);
        setTimeout(()=>setAnimate(false),400);

        const id = Date.now();
        const notification = { id, message: newLiked ? '좋아요를 눌렀습니다!' : '좋아요를 취소했습니다.'};
        const notificationErr = { id, message: '좋아요 처리에 실패했습니다.', type: 'error'};

        try {
            // 문서가 있으면 update, 없으면 create — merge=true 한 번에!
            await setDoc(docRef, {
                likeCount: increment(newLiked?1:-1),
                likedUsers: newLiked
                    ? arrayUnion(user.uid)
                    : arrayRemove(user.uid)
            }, { merge: true });

            showToast({ message: notification.message });
            addNotification(notification);

        } catch (err) {
            console.error('좋아요 처리 중 에러:', err);
            showToast({ message: notificationErr.message });
            addNotification(notificationErr);
        }
    };

    return (
        <div className="inline-flex  items-center relative text-sm text-gray-500">
            {type === 'heart' && (
                <>
                    <button
                        type="button"
                        onClick={handleLike}
                        className={clsx(
                            "group flex items-center px-2 hover:text-gray-800",
                            className
                        )}
                        aria-label="좋아요"
                    >
                        <Heart
                            className={clsx(
                                "shrink-0 size-4 transition-[fill] duration-300 stroke-textBase",
                                svgClassName,
                                liked ? '!fill-red-500 !stroke-red-500' : '',
                                animate ? 'animate-like' : ''
                            )}
                        />
                    </button>
                    {showCount && <span>{count}</span>}
                </>
            )}
            {type === 'thumb' && (
                <>
                    <button type="button"
                            onClick={handleLike}
                            className={clsx(
                                "group flex items-center text-xs md:text-sm hover:text-gray-800 focus:outline-hidden focus:text-gray-800",
                                "dark:hover:text-neutral-200 dark:focus:text-neutral-200",
                                liked ? "text-blue-600 font-medium" : "text-gray-500 dark:text-neutral-400"
                            )}
                            aria-label="좋아요"
                    >
                        <ThumbsUp
                            className={clsx(
                                "shrink-0 size-4 group-hover:text-gray-800 dark:group-hover:text-neutral-200",
                                "transition-all duration-300",
                                liked ? "fill-blue-600 stroke-blue-600 text-blue-600" : ""
                            )}
                        />
                    </button>
                    {showCount && <span className="inline-block ml-1.5">{count}</span>}
                </>
            )}
        </div>
    );
}
