import { Bookmark } from 'lucide-react';
import clsx from 'clsx';
import type { PlayerTrack } from '../../player/types/player.types';
import { useTrackBookmark } from '../hooks/useTrackBookmark';

export type TrackBookmarkButtonProps = {
  track: PlayerTrack;
  className?: string;
};

export default function TrackBookmarkButton({
  track,
  className,
}: TrackBookmarkButtonProps) {
  const {
    isBookmarked,
    isLoading,
    isSaving,
    toggleBookmark,
  } = useTrackBookmark(track);

  return (
    <button
      type="button"
      onClick={toggleBookmark}
      disabled={isLoading || isSaving}
      aria-pressed={isBookmarked}
      aria-label={isBookmarked ? '북마크 삭제' : '북마크 추가'}
      className={clsx(
        'inline-flex items-center justify-center disabled:cursor-wait disabled:opacity-50',
        className,
      )}
    >
      <Bookmark
        aria-hidden="true"
        className={clsx(
          'size-5',
          isBookmarked && 'fill-primary text-primary',
        )}
      />
    </button>
  );
}