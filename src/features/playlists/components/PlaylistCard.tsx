import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { createPlaylistPath } from '../../../constants/routes';
import PlaylistCoverArt from './PlaylistCoverArt';
import { getGeneratedCover } from '../utils/generatedCover';
import type { Playlist } from '../data/playlists';

interface PlaylistCardProps {
  playlist: Playlist;
}

export default function PlaylistCard({ playlist }: PlaylistCardProps) {
  const stack = getGeneratedCover(playlist.id).palette;

  const { search } = useLocation();

  return (
    <Link
      to={createPlaylistPath(playlist.id)}
      state={{ playlistListSearch: search }}
      aria-label={`${playlist.title} 플레이리스트, NEWTRONOME`}
      className={clsx(
        'group flex flex-col gap-3 rounded-xl text-textBase',
        'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary'
      )}
    >
      {/* 썸네일 + 뒤로 겹쳐 보이는 카드 두 장 */}
      <span aria-hidden="true" className="relative block aspect-square mt-3">
        {/* 뒷장과 앞장에 생성 커버와 같은 팔레트를 사용 */}
        <span
          className="absolute inset-x-[12%] -top-3 h-10 rounded-[10px] opacity-35"
          style={{ backgroundColor: stack.c3 }}
        />
        <span
          className="absolute inset-x-[6%] -top-1.5 h-10 rounded-xl opacity-60"
          style={{ backgroundColor: stack.c2 }}
        />
        <span
          className={clsx(
            'absolute inset-0 overflow-hidden rounded-xl bg-textThr',
            'shadow-[0_10px_24px_rgba(0,0,0,0.25)] dark:shadow-[0_10px_24px_rgba(0,0,0,0.45)]',
            'transition-shadow duration-300 group-hover:shadow-[0_14px_30px_rgba(0,0,0,0.4)]'
          )}
        >
          <PlaylistCoverArt playlist={playlist} zoomOnHover />
        </span>
      </span>

      <span className="flex min-w-0 flex-col gap-1">
        <span className="block truncate text-sm md:text-[15px] font-bold group-hover:text-primary transition-colors">
          {playlist.title}
        </span>
        <span className="block truncate font-inter text-[11px] font-black italic tracking-[0.02em] text-textSub">
          NEWTRONOME
        </span>
      </span>
    </Link>
  );
}
