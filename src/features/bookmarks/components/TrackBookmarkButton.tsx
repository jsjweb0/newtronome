import { Heart } from 'lucide-react';
import clsx from 'clsx';
import type { PlayerTrack } from '../../player/types/player.types';
import { useTrackBookmark } from '../hooks/useTrackBookmark';

export type TrackBookmarkButtonProps = {
  track: PlayerTrack;
  className?: string;
  iconClassName?: string;
  'aria-describedby'?: string;
};

export default function TrackBookmarkButton({
  track,
  className,
  iconClassName,
  'aria-describedby': ariaDescribedBy,
}: TrackBookmarkButtonProps) {
  const {
    isBookmarked,
    isLoading,
    isSaving,
    error,
    retrySubscription,
    toggleBookmark,
  } = useTrackBookmark(track);

  return (
    <button
      type="button"
      onClick={error !== null ? retrySubscription : toggleBookmark}
      disabled={isLoading || isSaving}
      aria-pressed={error !== null || isLoading ? undefined : isBookmarked}
      aria-label={
        error !== null
          ? `${error} 다시 시도`
          : isLoading
            ? '북마크 상태 확인 중'
            : isBookmarked
              ? '북마크 삭제'
              : '북마크 추가'
      }
      title={error !== null ? `${error} 다시 시도` : undefined}
      aria-describedby={ariaDescribedBy}
      className={clsx(
        'inline-flex items-center justify-center disabled:cursor-wait disabled:opacity-50',
        className,
      )}
    >
      <Heart
        aria-hidden="true"
        className={clsx(
          'size-6',
          !isLoading &&
          error === null &&
          isBookmarked &&
          'fill-primary text-primary',
          iconClassName
        )}
      />
    </button>
  );
}
