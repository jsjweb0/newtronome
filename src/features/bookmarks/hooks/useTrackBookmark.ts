import { useEffect, useState } from 'react';
import type { PlayerTrack } from '../../player/types/player.types';
import { useAuth } from '../../../contexts/useAuth';
import { useToast } from '../../../contexts/useToast';
import { removeSavedTrack, saveTrack, subscribeToSavedTrack } from '../services/savedTracks';

export function useTrackBookmark(track: PlayerTrack) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setIsBookmarked(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // 해당 트랙 문서 구독
    const unsubscribe = subscribeToSavedTrack(user.uid, track.id, (isSaved) => {
      setIsBookmarked(isSaved);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [user?.uid, track.id]);

  const toggleBookmark = async () => {
    if (!user?.uid) {
      showToast({
        message: '로그인 후 북마크할 수 있습니다.',
        type: 'info',
      });
      return;
    }

    if (isSaving) return;

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
    toggleBookmark,
  };
}
