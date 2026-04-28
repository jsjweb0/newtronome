import {useEffect, useState} from "react";
import {Heart} from "lucide-react";
import {doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, increment} from "firebase/firestore";
import {db} from "../../firebase";
import {useAuth} from "../../contexts/AuthContext.jsx";
import {useToast} from "../../contexts/ToastContext.jsx";

export default function PostLikeButton({postId, boardType = "free", showCount = true}) {
    const {user} = useAuth();
    const { showToast } = useToast();
    const [liked, setLiked] = useState(false);
    const [count, setCount] = useState(0);
    const [animate, setAnimate] = useState(false);

    const docRef = boardType === 'pet'
        ? doc(db, 'pet', postId.toString())
        : doc(db, boardType, postId.toString());

    useEffect(() => {
        const fetchLike = async () => {
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data();
                setCount(data.likeCount || 0);
                if (user) {
                    setLiked(data.likedUsers?.includes(user.email));
                }
            }
        };
        fetchLike();
    }, [postId, user]);

    const handleLike = async () => {
        if (!user) {
            showToast({message: '로그인 후 이용해 주세요!', type: 'info'});
            return true;
        }

        const snap = await getDoc(docRef);
        const alreadyExists = snap.exists();
        const alreadyLiked = snap.data()?.likedUsers?.includes(user.email);
        const newLiked = !alreadyLiked;

        setLiked(newLiked);
        setCount(prev => newLiked ? prev + 1 : prev - 1);
        setAnimate(true);
        setTimeout(() => setAnimate(false), 400);

        if (!alreadyExists) {
            await setDoc(docRef, {
                likeCount: 1,
                likedUsers: [user.email]
            });
        } else {
            await updateDoc(docRef, {
                likeCount: increment(newLiked ? 1 : -1),
                likedUsers: newLiked
                    ? arrayUnion(user.email)
                    : arrayRemove(user.email)
            });
        }

        showToast({
            message: newLiked ? '좋아요를 눌렀습니다!' : '좋아요를 취소했습니다.',
            type: 'success'
        });
    };

    if (!boardType) {
        console.warn("PostLikeButton: boardType이 전달되지 않았습니다.");
    }

    return (
        <div className="inline-block relative">
            <button type="button"
                    onClick={handleLike}
                    className="group flex items-center gap-x-2 text-sm text-gray-500 hover:text-gray-800 focus:outline-hidden focus:text-gray-800 dark:text-neutral-400 dark:hover:text-neutral-200 dark:focus:text-neutral-200">
                <Heart className={`shrink-0 size-4 transition-[fill] duration-300
                    ${liked ? 'fill-red-500 stroke-red-500' : ''}
                    ${animate ? 'animate-like' : ''}
                `}
                />
                {showCount && count}
                <span
                    className="opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity inline-block absolute left-1/2 z-10 py-1 px-2 -translate-x-1/2 -translate-y-full bg-gray-900 text-xs font-medium text-white rounded-md shadow-2xs dark:bg-black"
                    role="tooltip">
                    Like
                </span>
            </button>
        </div>
    )
}