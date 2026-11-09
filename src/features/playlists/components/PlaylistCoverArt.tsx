import clsx from 'clsx';
import noImage from '../../../assets/no-image.png';
import type { Playlist } from '../data/playlists';
import { getGeneratedCover } from '../utils/generatedCover';

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
 * 커버가 없으면 id로 고정되는 생성 커버를, 이미지 오류 시 no-image를 보여 준다.
 */
export default function PlaylistCoverArt({
  playlist,
  zoomOnHover = false,
  titleClassName = 'text-base md:text-xl',
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

  const { palette, shape } = getGeneratedCover(playlist.id);

  // 커버가 없으면 id로 고정되는 생성 커버 (배경 c1 · 도형 c2 · 아래 띠 c3)
  return (
    <span
      aria-hidden="true"
      data-generated-cover=""
      className="absolute inset-0 block overflow-hidden"
      style={{ backgroundColor: palette.c1 }}
    >
      <span className={clsx('absolute inset-0 block', zoomClass)}>
        <span
          className="absolute block w-[46%] aspect-square"
          style={{
            left: shape.left,
            top: shape.top,
            borderRadius: shape.borderRadius,
            transform: `rotate(${shape.rotate})`,
            backgroundColor: palette.c2,
          }}
        />
        <span
          className="absolute inset-x-0 bottom-0 block"
          style={{ height: shape.bandHeight, backgroundColor: palette.c3 }}
        />
      </span>
      <span
        className="absolute left-3.5 top-3 font-inter text-[10px] font-black italic tracking-[0.08em] opacity-85"
        style={{ color: palette.lc }}
      >
        NEWTRONOME
      </span>
      <span
        className={clsx(
          'absolute inset-x-3.5 bottom-3 font-inter font-black italic uppercase leading-[1.05] tracking-[-0.02em] break-keep line-clamp-2',
          titleClassName
        )}
        style={{ color: palette.lc }}
      >
        {playlist.title}
      </span>
    </span>
  );
}
