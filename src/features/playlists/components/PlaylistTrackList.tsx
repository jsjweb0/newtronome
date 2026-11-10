import { useMemo, useState } from 'react';
import { CircleX, List, ListMusic } from 'lucide-react';
import { GridIcon } from '../../../components/icons';
import TrackItem from '../../../components/track/TrackItem';
import TrackItemActions from '../../../components/track/TrackItemActions';
import type { PlayerTrack } from '../../player/types/player.types';

type ViewMode = 'grid' | 'list';

interface PlaylistTrackListProps {
  tracks: PlayerTrack[];
  currentTrack: PlayerTrack | null;
  isPlaying: boolean;
  onTrackClick: (track: PlayerTrack) => void;
  headingAs?: 'h2' | 'h3';
}

export default function PlaylistTrackList({
  tracks,
  currentTrack,
  isPlaying,
  onTrackClick,
  headingAs: HeadingTag = 'h3',
}: PlaylistTrackListProps) {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const filteredTracks = useMemo(() => {
    return tracks
      .slice()
      .filter((track) => (track.title || '').toLowerCase().includes(searchKeyword.toLowerCase()));
  }, [tracks, searchKeyword]);

  return (
    <div className="z-1 relative mt-1 md:mt-9">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 md:mb-8">
        {/* 제목 + 곡 수 */}
        <div className="flex items-center gap-x-2.5">
          <ListMusic className="size-5 md:size-[22px]" aria-hidden="true" />
          <HeadingTag className="text-xl md:text-[22px] font-bold">Track List</HeadingTag>
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
              onTrackClick={onTrackClick}
              actions={<TrackItemActions track={track} />}
            />
          );
        })}
      </div>
    </div>
  );
}
