import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import ImageSlider from '../components/ui/Slider';
import { selectCurrentTrack, usePlayerStore } from '../features/player/stores/usePlayerStore';
import { toHighResArtwork } from '../utils/image';
import { GridIcon } from '../components/icons';
import { CircleX, Clock, List, ListMusic, Play } from 'lucide-react';
import TrackItem from '../components/track/TrackItem';
import TrackItemActions from '../components/track/TrackItemActions';
import HomePageSkeleton from './HomePageSkeleton';
import soundCloudLogoBlack from '../assets/brands/soundcloud-logo-black.webp';
import soundCloudLogoWhite from '../assets/brands/soundcloud-logo-white.webp';
import type { PlayerOutletContext } from '../layouts/MainLayout';
import type { PlayerTrack } from '../features/player/types/player.types';
import RetryErrorState from '../components/ui/RetryErrorState';
import ExternalLink from '../components/ui/ExternalLink';

const formatDuration = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
};

type ViewMode = 'grid' | 'list';

export default function HomePage() {
  const {
    playlistUrl,
    onSelectTrack,
    onToggleTrack,
    playlistStatus,
    widgetError,
    retryLoad,
  } = useOutletContext<PlayerOutletContext>();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const playbackMode = usePlayerStore((state) => state.playbackMode);
  const tracks = usePlayerStore((state) => state.tracks);
  const currentTrack = usePlayerStore(selectCurrentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);

  const totalDurationMinutes = useMemo(() => {
    const totalDurationMs = tracks.reduce((total, track) => total + track.durationMs, 0);

    return Math.floor(totalDurationMs / 1000 / 60);
  }, [tracks]);

  const handleTrackClick = (track: PlayerTrack) => {
    const isCurrentTrack =
      playbackMode === 'playlist' &&
      String(currentTrack?.id) === String(track.id);

    if (isCurrentTrack) {
      onToggleTrack?.();
      return;
    }

    const trackIndex = tracks.findIndex((item) => String(item.id) === String(track.id));

    if (trackIndex === -1) return;

    onSelectTrack?.(trackIndex);
  };

  const [slideIndex, setSlideIndex] = useState(0);

  const slides = tracks
    .filter((track) => !!track?.artworkUrl)
    .map((track) => ({
      src: toHighResArtwork(track.artworkUrl, 't1080x1080'),
      title: track.title,
      subtitle: track.artist,
    }));

  const heroArtwork = slides[slideIndex]?.src ?? currentTrack?.artworkUrl ?? null;

  const filteredTracks = useMemo(() => {
    return tracks
      .slice()
      .filter((track) => (track.title || '').toLowerCase().includes(searchKeyword.toLowerCase()));
  }, [tracks, searchKeyword]);

  if (playlistStatus === 'loading') return <HomePageSkeleton />;

  if (playlistStatus === 'error') {
    return (
      <RetryErrorState
        message={
          widgetError ??
          '플레이리스트를 불러오지 못했습니다.'
        }
        onRetry={retryLoad}
      />
    );
  }

  if (playlistStatus === 'empty') {
    return <p className="px-3 py-14 text-textSub text-sm">플레이리스트가 비어 있어요</p>;
  }

  return (
    <div className="px-3">
      <section
        aria-label="플레이리스트 정보"
        className="relative isolate flex max-lg:flex-col items-center gap-10 lg:gap-12 px-5 pt-12 pb-14 lg:px-11 lg:pt-[94px] lg:pb-12"
      >
        {/* 배경: 지금 보이는 슬라이드 커버를 크게 흐려서 깔고, 가장자리는 서서히 사라지게 (박스 경계 없이 페이지로 이어짐) */}
        {heroArtwork && (
          <img
            key={heroArtwork}
            src={heroArtwork}
            alt=""
            aria-hidden="true"
            className="-z-10 absolute inset-0 w-full h-full object-cover blur-3xl opacity-50 animate-fade-in [mask-image:radial-gradient(ellipse_80%_65%_at_45%_35%,black_30%,transparent_100%)]"
          />
        )}

        <div className="shrink-0 w-full max-w-[620px] lg:w-[54%]">
          <ImageSlider
            images={slides.map((slide) => slide.src)}
            captions={slides}
            onSlideChange={setSlideIndex}
          />
        </div>

        <div className="grow min-w-0 max-lg:w-full">
          <span className="inline-block px-2.5 py-1 rounded-full bg-primary text-black font-inter text-[11px] font-extrabold tracking-[0.1em]">
            PLAYLIST
          </span>
          <h2 className="mt-4 font-black font-inter text-[44px] lg:text-[68px] leading-[0.95] tracking-[-0.03em]">
            Now Playlist
          </h2>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-4 text-[13px] text-textSub">
            <span className="flex items-center gap-1.5">
              <ListMusic aria-hidden="true" className="size-4" />
              {tracks.length} Tracks
            </span>
            <span className="flex items-center gap-1.5">
              <Clock aria-hidden="true" className="size-4" />
              {formatDuration(totalDurationMinutes)}
            </span>
          </div>
          {playlistUrl && (
            <p className="flex items-center gap-1.5 mt-3 text-[11px] md:text-sm text-textSub">
              Music provided by{' '}
              <ExternalLink
                href={playlistUrl}
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
          <div className="flex flex-wrap items-center gap-2.5 mt-6">
            <button
              type="button"
              onClick={() => onSelectTrack?.(0)}
              className="inline-flex items-center gap-2 h-13 px-6.5 rounded-full bg-primary text-black text-[15px] font-bold hover:brightness-110 transition"
            >
              <Play aria-hidden="true" className="size-5 fill-current" />
              전체 재생
            </button>
          </div>
        </div>
      </section>

      <div className="z-1 relative mt-1 md:mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 md:mb-8">
          {/* 제목 + 곡 수 */}
          <div className="flex items-center gap-x-2.5">
            <ListMusic className="size-5 md:size-[22px]" aria-hidden="true" />
            <h3 className="text-xl md:text-[22px] font-bold">Track List</h3>
            <span className="text-xs md:text-[13px] text-textSub">
              {searchKeyword ? `${filteredTracks.length} / ${tracks.length}곡` : `${tracks.length}곡`}
            </span>
          </div>

          {/* 필터 + 보기 전환 */}
          <div className="flex items-center gap-x-2.5 max-md:w-full">
            <div className="relative grow md:grow-0 md:w-50">
              <label htmlFor="search-track-input" className="sr-only">검색어</label>
              <input
                type="text"
                id="search-track-input"
                className="block w-full h-11 mb-0 pl-3.5 pr-10 border border-textThr dark:border-none rounded-[10px] bg-background text-sm disabled:opacity-50 disabled:pointer-events-none focus:ring-primary"
                placeholder="Filter"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => setSearchKeyword('')}
                  className="inline-flex items-center justify-center absolute top-0 right-0 h-full w-10 text-textSub hover:text-textBase"
                  aria-label="검색어 삭제"
                >
                  <CircleX className="size-4" aria-hidden="true" />
                </button>
              )}
            </div>
            <span className="shrink-0 ml-1 text-[13px] text-textSub">View</span>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`shrink-0 inline-flex justify-center items-center size-11 rounded-[10px] transition-colors ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'bg-background text-textSub hover:text-textBase'}`}
              aria-pressed={viewMode === 'grid'}
              aria-label="앨범형"
            >
              <GridIcon className="size-[18px]" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`shrink-0 inline-flex justify-center items-center size-11 rounded-[10px] transition-colors ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'bg-background text-textSub hover:text-textBase'}`}
              aria-pressed={viewMode === 'list'}
              aria-label="목록형"
            >
              <List className="size-[18px]" aria-hidden="true" />
            </button>
          </div>
        </div>
        {viewMode === 'list' && (
          <div
            aria-hidden="true"
            className="max-md:hidden grid grid-cols-[44px_48px_minmax(0,1fr)_72px_auto] gap-x-3 items-center min-h-10 px-3 border-b border-textThr text-xs font-medium tracking-wide text-textSub"
          >
            <span className="text-center">#</span>
            <span></span>
            <span>제목 / 아티스트</span>
            <span className="text-right">시간</span>
            <span className="w-27"></span>
          </div>
        )}
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(176px,1fr))] gap-x-3 md:gap-x-5 gap-y-6 md:gap-y-7'
              : 'flex flex-col'
          }
        >
          {filteredTracks.map((track, idx) => {
            return (
              <TrackItem
                key={`${track.id}-${idx}`}
                idx={idx}
                track={track}
                currentTrack={currentTrack}
                viewMode={viewMode}
                isPlaying={isPlaying}
                onTrackClick={handleTrackClick}
                actions={<TrackItemActions track={track} />}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
