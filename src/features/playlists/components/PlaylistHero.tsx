import { useMemo, useState, type ReactNode } from 'react';
import { Clock, ListMusic } from 'lucide-react';
import ImageSlider from '../../../components/ui/Slider';
import ExternalLink from '../../../components/ui/ExternalLink';
import { toHighResArtwork } from '../../../utils/image';
import soundCloudLogoBlack from '../../../assets/brands/soundcloud-logo-black.webp';
import soundCloudLogoWhite from '../../../assets/brands/soundcloud-logo-white.webp';
import type { PlayerTrack } from '../../player/types/player.types';

const formatDuration = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
};

interface PlaylistHeroProps {
  title: string;
  /** 홈은 h2(사이트 제목이 h1), 플레이리스트 상세는 h1 */
  titleAs?: 'h1' | 'h2';
  titleId?: string;
  tracks: PlayerTrack[];
  soundCloudUrl?: string | null;
  /** 커버 있는 곡이 없을 때 배경으로 쓸 이미지 */
  fallbackArtwork?: string | null;
  /** 제목 위 PLAYLIST 배지 옆에 붙일 내용 (예: 목록으로) */
  children?: ReactNode;
}

/** 플레이리스트 상단: 곡 커버 슬라이더 + PLAYLIST 정보 (시안 Playlists Detail) */
export default function PlaylistHero({
  title,
  titleAs: TitleTag = 'h2',
  titleId,
  tracks,
  soundCloudUrl,
  fallbackArtwork = null,
  children,
}: PlaylistHeroProps) {
  const [slideIndex, setSlideIndex] = useState(0);

  const totalDurationMinutes = useMemo(() => {
    const totalDurationMs = tracks.reduce((total, track) => total + track.durationMs, 0);

    return Math.floor(totalDurationMs / 1000 / 60);
  }, [tracks]);

  const slides = tracks
    .filter((track) => !!track?.artworkUrl)
    .map((track) => ({
      src: toHighResArtwork(track.artworkUrl, 't1080x1080'),
      title: track.title,
      subtitle: track.artist,
    }));

  const heroArtwork = slides[slideIndex]?.src ?? fallbackArtwork;

  return (
    <section
      aria-label="플레이리스트 정보"
      className="relative isolate flex max-lg:flex-col items-center gap-7 lg:gap-12 px-5 py-6 lg:px-11 lg:-mt-10 lg:pt-[50px] lg:pb-10"
    >
      {/* 배경: 지금 보이는 슬라이드 커버를 크게 흐려서 깔고, 가장자리는 서서히 사라지게 (박스 경계 없이 페이지로 이어짐)
          - 마스크는 바깥 래퍼, 블러는 안쪽 이미지에 따로 줘야 블러 번짐이 박스 모서리에서 직선으로 잘리지 않음
          - 마스크가 래퍼 가장자리보다 안쪽에서 완전히 투명해지도록 설정 (아래쪽은 Track List 전에 사라짐) */}
      {heroArtwork && (
        <div
          aria-hidden="true"
          className="pointer-events-none -z-10 absolute -inset-x-10 -top-16 bottom-0 [mask-image:radial-gradient(ellipse_70%_65%_at_50%_45%,black_25%,transparent_70%)]"
        >
          <img
            key={heroArtwork}
            src={heroArtwork}
            alt=""
            className="size-full object-cover scale-110 blur-[90px] opacity-60 animate-fade-in"
          />
        </div>
      )}

      <div className="shrink-0 w-full max-w-[620px] lg:w-[56%]">
        <ImageSlider
          images={slides.map((slide) => slide.src)}
          captions={slides}
          onSlideChange={setSlideIndex}
        />
      </div>

      <div className="grow flex flex-col items-start gap-y-5 min-w-0 max-lg:w-full">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-block px-2.5 py-1 rounded-full bg-primary text-black font-inter text-[11px] font-extrabold tracking-[0.1em]">
            PLAYLIST
          </span>
          {children}
        </div>
        <TitleTag
          id={titleId}
          className="font-black font-inter text-[44px] lg:text-[68px] leading-[0.95] tracking-[-0.03em] break-keep"
        >
          {title}
        </TitleTag>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-textSub">
          <span className="flex items-center gap-1.5">
            <ListMusic aria-hidden="true" className="size-4" />
            {tracks.length} Tracks
          </span>
          <span className="flex items-center gap-1.5">
            <Clock aria-hidden="true" className="size-4" />
            {formatDuration(totalDurationMinutes)}
          </span>
        </div>
        {soundCloudUrl && (
          <p className="flex items-center gap-1.5 text-[11px] md:text-sm text-textSub">
            Music provided by{' '}
            <ExternalLink
              href={soundCloudUrl}
              label="SoundCloud에서 플레이리스트 열기"
              title="SoundCloud에서 플레이리스트 열기 (새 창)"
              className="flex hover:text-primary"
            >
              <img
                src={soundCloudLogoBlack}
                alt=""
                className="w-20 md:w-24 dark:hidden"
              />
              <img
                src={soundCloudLogoWhite}
                alt=""
                className="hidden w-20 md:w-24 dark:block"
              />
            </ExternalLink>
          </p>
        )}
      </div>
    </section>
  );
}
