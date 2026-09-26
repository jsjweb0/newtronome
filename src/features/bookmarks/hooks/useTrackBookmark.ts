import { useEffect, useState } from 'react';
import type { PlayerTrack } from '../../player/types/player.types';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { removeSavedTrack, saveTrack, subscribeToSavedTrack } from '../services/savedTracks';

export function useTrackBookmark(track: PlayerTrack) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setError(null);

    if (!user?.uid) {
      setIsBookmarked(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // 해당 트랙 문서 구독
    const unsubscribe = subscribeToSavedTrack(user.uid, track.id, (isSaved) => {
      setIsBookmarked(isSaved);
      setError(null);
      setIsLoading(false);
    },
      () => {
        setError('북마크 상태를 확인하지 못했습니다.');
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.uid, track.id, retryCount]);

  const retrySubscription = () => {
    showToast({
      message: '북마크 상태를 확인하지 못해 다시 조회합니다.',
      type: 'error',
    });

    setRetryCount((previousCount) => previousCount + 1);
  };

  const toggleBookmark = async () => {
    if (!user?.uid) {
      showToast({
        message: '로그인 후 북마크할 수 있습니다.',
        type: 'info',
      });
      return;
    }

    if (isLoading || isSaving || error !== null) return;

    setIsSaving(true);

    try {
      if (isBookmarked) {
        await removeSavedTrack(user.uid, track.id);

        showToast({
          message: '북마크를 삭제했습니다.',
          type: 'success',
        });
      } else {
        await saveTrack(user.uid, track);

        showToast({
          message: '북마크에 저장했습니다.',
          type: 'success',
        });
      }
    } catch {
      showToast({
        message: '북마크 처리에 실패했습니다.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isBookmarked,
    isLoading,
    isSaving,
    error,
    retrySubscription,
    toggleBookmark,
  };
}
