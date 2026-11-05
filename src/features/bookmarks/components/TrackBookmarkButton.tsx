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
    isBookmarkBlocked,
    isLoading,
    isSaving,
    error,
    retrySubscription,
    toggleBookmark,
  } = useTrackBookmark(track);

  const isAddBlocked = error === null && isBookmarkBlocked;

  const buttonLabel =
    error !== null
      ? `${error} 다시 시도`
      : isLoading
        ? '북마크 상태 확인 중'
        : isBookmarked
          ? '북마크 삭제'
          : isAddBlocked
            ? '재생 불가 곡은 북마크에 추가할 수 없습니다'
            : '북마크 추가';

  return (
    <button
      type="button"
      onClick={error !== null ? retrySubscription : toggleBookmark}
      disabled={isLoading || isSaving || isAddBlocked}
      aria-pressed={error !== null || isLoading ? undefined : isBookmarked}
      aria-label={buttonLabel}
      title={buttonLabel}
      aria-describedby={ariaDescribedBy}
      className={clsx(
        'inline-flex items-center justify-center disabled:cursor-wait disabled:opacity-50',
        (isLoading || isSaving) && 'cursor-wait',
        isAddBlocked && 'cursor-not-allowed',
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
