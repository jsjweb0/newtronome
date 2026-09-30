import { useEffect, useMemo, useRef, useState } from 'react';
import { Heart, ThumbsUp } from 'lucide-react';
import { doc, onSnapshot, setDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import clsx from 'clsx';

interface LikeButtonProps {
  type?: 'heart' | 'thumb';
  collection: string;
  docId: string | number;
  parentId?: string | number;
  subCollection?: 'comments';
  showCount?: boolean;
  className?: string;
  svgClassName?: string;
  'aria-describedby'?: string;
}

export default function LikeButton({
  type = 'heart',
  collection,
  docId, // 문서 ID (포스트ID 또는 댓글ID)
  parentId = undefined, // 댓글일 때만 필요
  subCollection = undefined, // 댓글일 때만 "comments"
  showCount = true,
  className = '',
  svgClassName = '',
  'aria-describedby': ariaDescribedBy,
}: LikeButtonProps) {
  const { user } = useAuth();
  const [lookupStatus, setLookupStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [isSaving, setIsSaving] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const savingRef = useRef(false);
  const uid = user?.uid;

  const { showToast } = useToast();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [animate, setAnimate] = useState(false);

  const commentDocId = String(docId);

  const docRef = useMemo(
    () =>
      subCollection && parentId !== undefined
        ? doc(db, collection, String(parentId), subCollection, commentDocId)
        : doc(db, collection, commentDocId),
    [collection, commentDocId, parentId, subCollection]
  );

  useEffect(() => {
    if (!uid) {
      setLiked(false);
      setCount(0);
      setLookupStatus('ready');
      return;
    }

    let active = true;
    setLookupStatus('loading');

    const unsubscribe = onSnapshot(
      docRef,
      { includeMetadataChanges: true },
      (snap) => {
        if (!active || snap.metadata?.hasPendingWrites) return;

        const data = snap.data();
        const likedUsers = Array.isArray(data?.likedUsers)
          ? data.likedUsers.filter(
            (value): value is string => typeof value === 'string'
          )
          : [];

        setLiked(likedUsers.includes(uid));
        setCount(
          typeof data?.likeCount === 'number' && Number.isFinite(data.likeCount)
            ? data.likeCount
            : 0
        );
        setLookupStatus('ready');
      },
      () => {
        if (active) setLookupStatus('error');
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [docRef, uid, retryCount]);

  const retryLookup = () => {
    setLookupStatus('loading');
    setRetryCount((count) => count + 1);
  };

  const handleLike = async () => {
    if (!user) {
      showToast({ message: '로그인 후 이용해 주세요!', type: 'info' });
      return;
    }

    if (lookupStatus !== 'ready' || savingRef.current) return;

    savingRef.current = true;
    setIsSaving(true);

    const newLiked = !liked;

    try {
      await setDoc(
        docRef,
        {
          likeCount: increment(newLiked ? 1 : -1),
          likedUsers: newLiked ? arrayUnion(uid) : arrayRemove(uid),
        },
        { merge: true }
      );

      setAnimate(true);
      window.setTimeout(() => setAnimate(false), 400);
      showToast({
        message: newLiked ? '좋아요를 눌렀습니다!' : '좋아요를 취소했습니다.',
      });
    } catch {
      showToast({ message: '좋아요 처리에 실패했습니다.', type: 'error' });
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  return (
    <div className="inline-flex  items-center relative text-sm text-gray-500">
      {type === 'heart' && (
        <>
          <button
            type="button"
            onClick={lookupStatus === 'error' ? retryLookup : handleLike}
            disabled={lookupStatus === 'loading' || isSaving}
            aria-label={
              lookupStatus === 'error'
                ? '좋아요 상태를 확인하지 못했습니다. 다시 시도'
                : '좋아요'
            }
            aria-describedby={ariaDescribedBy}
            className={clsx('group flex items-center px-2 hover:text-gray-800', className)}
          >
            <Heart
              className={clsx(
                'shrink-0 size-4 transition-[fill] duration-300 stroke-textBase',
                svgClassName,
                liked ? 'fill-red-500! stroke-red-500!' : '',
                animate ? 'animate-like' : ''
              )}
              aria-hidden="true"
            />
          </button>
          {showCount && <span>{count}</span>}
        </>
      )}
      {type === 'thumb' && (
        <>
          <button
            type="button"
            onClick={lookupStatus === 'error' ? retryLookup : handleLike}
            disabled={lookupStatus === 'loading' || isSaving}
            aria-label={
              lookupStatus === 'error'
                ? '좋아요 상태를 확인하지 못했습니다. 다시 시도'
                : '좋아요'
            }
            aria-describedby={ariaDescribedBy}
            className={clsx(
              'group flex items-center text-xs md:text-sm hover:text-gray-800 focus:outline-hidden focus:text-gray-800',
              'dark:hover:text-neutral-200 dark:focus:text-neutral-200',
              liked ? 'text-blue-600 font-medium' : 'text-gray-500 dark:text-neutral-400'
            )}
          >
            <ThumbsUp
              className={clsx(
                'shrink-0 size-4 group-hover:text-gray-800 dark:group-hover:text-neutral-200',
                'transition-all duration-300',
                liked ? 'fill-blue-600 stroke-blue-600 text-blue-600' : ''
              )}
              aria-hidden="true"
            />
          </button>
          {showCount && <span className="inline-block ml-1.5">{count}</span>}
        </>
      )}
    </div>
  );
}
