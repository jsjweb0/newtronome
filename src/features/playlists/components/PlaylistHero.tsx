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
  /** 'Music provided by' 링크 (홈). 상세는 버튼 줄의 SoundCloud 버튼으로 대신함 */
  soundCloudUrl?: string | null;
  fallbackArtwork?: string | null;
  cover?: ReactNode;
  /** 제목 아래 큐레이션 줄 (플레이리스트 상세) */
  curation?: ReactNode;
  /** 곡 수 · 재생시간 아래 버튼 줄 (플레이리스트 상세) */
  actions?: ReactNode;
}

export default function PlaylistHero({
  title,
  titleAs: TitleTag = 'h2',
  titleId,
  tracks,
  soundCloudUrl,
  fallbackArtwork = null,
  cover,
  curation,
  actions,
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
      {!cover && heroArtwork && (
        <div
          aria-hidden="true"
          className="pointer-events-none -z-10 absolute -inset-x-10 -top-16 bottom-0 [mask-image:radial-gradient(ellipse_85%_55%_at_45%_45%,black_0%,transparent_90%)]"
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
        {cover ?? (
          <ImageSlider
            images={slides.map((slide) => slide.src)}
            captions={slides}
            onSlideChange={setSlideIndex}
          />
        )}
      </div>

      <div className="grow flex flex-col items-start gap-y-5 min-w-0 max-lg:w-full">
        <span className="inline-block px-2.5 py-1 rounded-full bg-primary text-black font-inter text-[11px] font-extrabold tracking-[0.1em]">
          PLAYLIST
        </span>
        <TitleTag
          id={titleId}
          className="font-black font-inter text-[44px] lg:text-[68px] leading-[0.95] tracking-[-0.03em] break-keep"
        >
          {title}
        </TitleTag>
        {curation}
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
        {actions}
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
