import clsx from 'clsx';
import noImage from '../../../assets/no-image.png';
import type { Playlist } from '../data/playlists';

interface PlaylistCoverArtProps {
  playlist: Playlist;
  /** 링크 카드 안에서 hover/focus 시 커버 확대 */
  zoomOnHover?: boolean;
  /** 커버가 없을 때 얹는 제목 글씨 크기 */
  titleClassName?: string;
  loading?: 'lazy' | 'eager';
}

/**
 * 플레이리스트 커버 이미지. 부모가 크기와 둥근 모서리(overflow-hidden)를 정한다.
 * 커버가 없으면 테마 색 배경에 제목을, 이미지 오류 시 no-image를 보여 준다.
 */
export default function PlaylistCoverArt({
  playlist,
  zoomOnHover = false,
  titleClassName = 'text-lg md:text-xl',
  loading = 'lazy',
}: PlaylistCoverArtProps) {
  const zoomClass =
    zoomOnHover &&
    'transition-transform duration-300 group-hover:scale-110 group-focus-visible:scale-110';

  if (playlist.coverUrl) {
    return (
      <img
        src={playlist.coverUrl}
        alt=""
        loading={loading}
        className={clsx('absolute inset-0 block size-full object-cover', zoomClass)}
        onError={(event) => {
          event.currentTarget.src = noImage;
          event.currentTarget.onerror = null;
        }}
      />
    );
  }

  return (
    <>
      <span
        className={clsx(
          'absolute inset-0 block',
          'bg-[radial-gradient(circle_at_30%_25%,var(--color-primary)_0,transparent_55%)] opacity-35',
          zoomClass
        )}
      />
      <span
        className={clsx(
          'absolute inset-x-[7%] bottom-[6%] font-inter font-black italic uppercase leading-[1.05] tracking-[-0.02em] text-textBase break-keep line-clamp-2',
          titleClassName
        )}
      >
        {playlist.title}
      </span>
    </>
  );
}
