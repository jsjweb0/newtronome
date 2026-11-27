import { useEffect, useMemo, useRef, useState } from 'react';
import { Heart, ThumbsUp } from 'lucide-react';
import { doc, onSnapshot, setDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import clsx from 'clsx';
import { useQueryClient } from '@tanstack/react-query';
import { commentQueryKeys } from '../../features/board/queries/commentQueryKeys';
import { isCommunityBoardType } from '../../features/board/types/post';

interface LikeButtonProps {
  type?: 'heart' | 'thumb';
  collection: string;
  docId: string | number;
  parentId?: string | number;
  subCollection?: 'comments';
  initialCount?: number;
  showCount?: boolean;
  className?: string;
  svgClassName?: string;
  'aria-describedby'?: string;
}

const normalizeLikeCount = (value: number | undefined) =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : 0;

export default function LikeButton({
  type = 'heart',
  collection,
  docId, // 문서 ID (포스트ID 또는 댓글ID)
  parentId = undefined, // 댓글일 때만 필요
  subCollection = undefined, // 댓글일 때만 "comments"
  initialCount,
  showCount = true,
  className = '',
  svgClassName = '',
  'aria-describedby': ariaDescribedBy,
}: LikeButtonProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [lookupStatus, setLookupStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [isSaving, setIsSaving] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const savingRef = useRef(false);
  const uid = user?.uid;

  const { showToast } = useToast();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(() => normalizeLikeCount(initialCount));
  const [animate, setAnimate] = useState(false);

  const commentDocId = String(docId);

  const docRef = useMemo(
    () =>
      subCollection && parentId !== undefined
        ? doc(db, collection, String(parentId), subCollection, commentDocId)
        : doc(db, collection, commentDocId),
    [collection, commentDocId, parentId, subCollection]
  );

  const isUnavailable = lookupStatus === 'loading' || isSaving;

  const usesInitialCount = !uid && (!showCount || initialCount !== undefined);

  useEffect(() => {
    if (!usesInitialCount) return;

    setLiked(false);
    setCount(normalizeLikeCount(initialCount));
    setLookupStatus('ready');
  }, [usesInitialCount, initialCount]);

  useEffect(() => {
    if (usesInitialCount) return;

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

        setLiked(
          typeof uid === 'string' && likedUsers.includes(uid)
        );

        setCount(
          typeof data?.likeCount === 'number' &&
            Number.isFinite(data.likeCount)
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
  }, [
    docRef,
    uid,
    retryCount,
    usesInitialCount,
  ]);

  const retryLookup = () => {
    setLookupStatus('loading');
    setRetryCount((count) => count + 1);
  };

  const handleLike = async () => {
    if (!user) {
      showToast({
        message: '로그인 후 이용해 주세요!',
        type: 'info',
        action: { label: '로그인', to: '/login' },
      });
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

      if (
        subCollection === 'comments' &&
        parentId !== undefined &&
        isCommunityBoardType(collection)
      ) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: commentQueryKeys.post(
              collection,
              String(parentId),
            ),
          }),
          queryClient.invalidateQueries({
            queryKey: commentQueryKeys.mineRoot(),
          }),
        ])
      }

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
    <div className="inline-flex items-center relative text-sm text-textSub">
      {type === 'heart' && (
        <>
          <button
            type="button"
            aria-label={
              lookupStatus === 'error'
                ? '좋아요 상태를 확인하지 못했습니다. 다시 시도'
                : '좋아요'
            }
            aria-describedby={ariaDescribedBy}
            aria-pressed={liked}
            aria-disabled={isUnavailable}
            aria-busy={isSaving}
            onClick={() => {
              if (isUnavailable || savingRef.current) return;

              if (lookupStatus === 'error') {
                retryLookup();
                return;
              }

              void handleLike();
            }}
            className={clsx('group flex items-center px-2 hover:text-gray-800',
              'aria-disabled:opacity-50 aria-disabled:cursor-wait',
              className
            )}
          >
            <Heart
              className={clsx(
                'shrink-0 size-4 transition-[fill] duration-300 stroke-textBase',
                svgClassName,
                liked ? 'fill-primary! stroke-primary!' : '',
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
            aria-label={
              lookupStatus === 'error'
                ? '좋아요 상태를 확인하지 못했습니다. 다시 시도'
                : '좋아요'
            }
            aria-describedby={ariaDescribedBy}
            aria-pressed={liked}
            aria-disabled={isUnavailable}
            aria-busy={isSaving}
            onClick={() => {
              if (isUnavailable || savingRef.current) return;

              if (lookupStatus === 'error') {
                retryLookup();
                return;
              }

              void handleLike();
            }}
            className={clsx(
              'group flex items-center justify-center min-h-9 min-w-9 rounded-full text-[13px]',
              'hover:bg-field hover:text-textBase focus-visible:outline-2 focus-visible:outline-primary',
              'aria-disabled:opacity-50 aria-disabled:cursor-wait',
              liked ? 'text-primary font-bold' : 'text-textSub'
            )}
          >
            <ThumbsUp
              className={clsx(
                'shrink-0 size-4',
                'transition-all duration-300',
                liked ? 'fill-primary/30 stroke-primary text-primary' : ''
              )}
              aria-hidden="true"
            />
          </button>
          {showCount && <span className="inline-block -ml-1 mr-1.5 text-[13px] text-textSub tabular-nums">{count}</span>}
        </>
      )}

      {isSaving && (
        <span role="status" className="ml-2 text-xs text-textSub">
          서버에 반영하는 중입니다.
        </span>
      )}
    </div>
  );
}
