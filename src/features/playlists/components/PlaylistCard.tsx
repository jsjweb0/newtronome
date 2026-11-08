import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { AudioEqualizerIcon } from '../../../components/icons';
import PlaylistCoverArt from './PlaylistCoverArt';
import { createPlaylistHomePath, type Playlist } from '../data/playlists';

interface PlaylistCardProps {
  playlist: Playlist;
  /** 지금 홈에 불러와 있는 플레이리스트인지 */
  isCurrent?: boolean;
  /** 이 플레이리스트의 곡이 재생 중인지 */
  isPlaying?: boolean;
  /** 곡 수 · 재생시간은 불러온 플레이리스트만 알 수 있어서 선택 */
  trackCount?: number;
  durationLabel?: string;
}

export default function PlaylistCard({
  playlist,
  isCurrent = false,
  isPlaying = false,
  trackCount,
  durationLabel,
}: PlaylistCardProps) {
  const meta = [
    trackCount !== undefined ? `${trackCount}곡` : null,
    durationLabel ?? null,
  ].filter((item): item is string => Boolean(item));

  const ariaLabel = [
    `${playlist.title} 플레이리스트`,
    'NEWTRONOME',
    ...meta,
    isPlaying ? '재생 중' : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Link
      to={createPlaylistHomePath(playlist.id)}
      aria-label={ariaLabel}
      aria-current={isCurrent ? 'true' : undefined}
      className={clsx(
        'group flex flex-col gap-3 rounded-xl text-textBase',
        'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary'
      )}
    >
      {/* 썸네일 + 뒤로 겹쳐 보이는 카드 두 장 */}
      <span aria-hidden="true" className="relative block aspect-square mt-3">
        <span className="absolute inset-x-[12%] -top-3 h-10 rounded-[10px] bg-textSub/25" />
        <span className="absolute inset-x-[6%] -top-1.5 h-10 rounded-xl bg-textSub/45" />
        <span
          className={clsx(
            'absolute inset-0 overflow-hidden rounded-xl bg-textThr',
            'shadow-[0_10px_24px_rgba(0,0,0,0.25)] dark:shadow-[0_10px_24px_rgba(0,0,0,0.45)]',
            'transition-shadow duration-300 group-hover:shadow-[0_14px_30px_rgba(0,0,0,0.4)]'
          )}
        >
          <PlaylistCoverArt playlist={playlist} zoomOnHover />
          {isPlaying && (
            <span className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-black/72 px-2.5 py-1 text-[11px] font-bold text-primary">
              <AudioEqualizerIcon isPlaying aria-hidden="true" className="size-3" />
              재생 중
            </span>
          )}
        </span>
      </span>

      <span className="flex min-w-0 flex-col gap-1">
        <span
          className={clsx(
            'block truncate text-sm md:text-[15px] font-bold',
            isCurrent && 'text-primary'
          )}
        >
          {playlist.title}
        </span>
        <span className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-xs text-textSub">
          <span className="shrink-0 font-inter text-[11px] font-black italic tracking-[0.02em]">
            NEWTRONOME
          </span>
          {meta.length > 0 && (
            <>
              <span className="size-[3px] shrink-0 rounded-full bg-textSub/60" />
              <span className="truncate tabular-nums">{meta.join(' · ')}</span>
            </>
          )}
        </span>
      </span>
    </Link>
  );
}
