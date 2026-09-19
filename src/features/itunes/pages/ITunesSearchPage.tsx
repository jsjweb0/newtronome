import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ITunesTrack } from "../types/itunes.types";
import type { PlayerTrack } from '../../player/types/player.types';
import { searchITunesTracks } from "../services/searchITunesTracks";
import { Music, Search as SearchIcon, CircleX, Music2, Clock3, ChevronRight, X as XIcon, Plus as PlusIcon } from "lucide-react";
import clsx from "clsx";
import { AudioEqualizerIcon } from '../../../components/icons';
import TrackItemSkeleton from "../../../components/track/TrackItemSkeleton";
import appleMusicBadge from '../../../assets/brands/apple-music-listen-badge-2x.png';
import Tooltip from "../../../components/ui/Tooltip";
import TrackItem from "../../../components/track/TrackItem";
import { useOutletContext } from "react-router-dom";
import type { PlayerOutletContext } from "../../../layouts/MainLayout";
import { usePlayerStore } from "../../player/stores/usePlayerStore";

const getLargeArtworkUrl = (artworkUrl: string) => {
  return artworkUrl.replace(
    '100x100bb',
    '600x600bb'
  );
};

const mapITunesTrackToPlayerTrack = (
  track: ITunesTrack
): PlayerTrack => ({
  id: track.trackId,
  title: track.trackName,
  artist: track.artistName,
  artworkUrl: track.artworkUrl100
    ? getLargeArtworkUrl(track.artworkUrl100)
    : null,
  permalinkUrl: track.trackViewUrl ?? null,
  durationMs: track.trackTimeMillis ?? 0,
  genre: '',
  tags: [],
});

const RECENT_SEARCHES_KEY = 'recentSearches';
const MAX_RECENT_SEARCHES = 5;
const INITIAL_VISIBLE_COUNT = 20;
const LOAD_MORE_COUNT = 20;

export default function ITunesSearchPage() {
  const { onPauseSoundCloud } = useOutletContext<PlayerOutletContext>();

  const [keyword, setKeyword] = useState('');
  const [tracks, setTracks] = useState<ITunesTrack[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  const visibleTracks = tracks.slice(0, visibleCount);
  const hasMoreTracks = visibleCount < tracks.length;

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  const [playingPreviewTrackId, setPlayingPreviewTrackId] = useState<number | null>(null);

  const playlistTracks = usePlayerStore((state) => state.tracks);
  const [recommendedArtists, setRecommendedArtists] = useState<string[]>([]);

  // 최근 검색어
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];

    try {
      const storedValue = localStorage.getItem(RECENT_SEARCHES_KEY);

      if (!storedValue) return [];

      const parsedValue: unknown = JSON.parse(storedValue);

      if (!Array.isArray(parsedValue)) return [];

      return parsedValue
        .filter((value): value is string => typeof value === 'string')
        .slice(0, MAX_RECENT_SEARCHES);
    } catch {
      return [];
    }
  });

  const saveRecentSearch = (searchTerm: string) => {
    const trimmedSearchTerm = searchTerm.trim();

    if (!trimmedSearchTerm) {
      return;
    }

    setRecentSearches((previousSearches) => {
      const nextSearches = [
        trimmedSearchTerm,
        ...previousSearches.filter(
          (term) => term.toLowerCase() !== trimmedSearchTerm.toLowerCase()
        ),
      ].slice(0, MAX_RECENT_SEARCHES);

      localStorage.setItem(
        RECENT_SEARCHES_KEY,
        JSON.stringify(nextSearches)
      );

      return nextSearches;
    });
  };

  const removeRecentSearch = (searchTerm: string) => {
    setRecentSearches((previousSearches) => {
      const nextSearches = previousSearches.filter(
        (term) => term !== searchTerm
      );

      localStorage.setItem(
        RECENT_SEARCHES_KEY,
        JSON.stringify(nextSearches)
      );

      return nextSearches;
    });
  };

  useEffect(() => {
    const uniqueArtists = [
      ...new Set(
        playlistTracks.map((track) => track.artist.trim()).filter((artist) => artist && artist !== '알 수 없는 아티스트')
      ),
    ];

    const shuffledArtists = [...uniqueArtists];

    for (
      let index = shuffledArtists.length - 1;
      index > 0;
      index -= 1
    ) {
      const randomIndex = Math.floor(
        Math.random() * (index + 1)
      );

      [
        shuffledArtists[index],
        shuffledArtists[randomIndex],
      ] = [
          shuffledArtists[randomIndex],
          shuffledArtists[index],
        ];
    }

    setRecommendedArtists(shuffledArtists.slice(0, 5));
  }, [playlistTracks]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const runSearch = async (searchTerm: string) => {
    const trimmedKeyword = searchTerm.trim();

    if (!trimmedKeyword) return;

    // 진행 중인 이전 검색 요청과 미리듣기 취소
    abortControllerRef.current?.abort();
    stopPreview();
    setVisibleCount(INITIAL_VISIBLE_COUNT);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // input이 이후 변경되어도 검색 당시 검색어를 보존
    setSearchKeyword(trimmedKeyword);
    setHasSearched(true);
    setIsLoading(true);
    setErrorMessage('');

    try {
      const searchResults = await searchITunesTracks(
        trimmedKeyword,
        controller.signal
      );

      saveRecentSearch(trimmedKeyword);
      setTracks(searchResults);
    } catch (error: unknown) {
      if (
        error instanceof DOMException &&
        error.name === 'AbortError'
      ) {
        return;
      }

      setTracks([]);
      setErrorMessage('검색 결과를 불러오지 못했습니다.');
    } finally {
      // 이전 요청이 새 요청의 로딩 상태를 끄지 않도록 확인
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setIsLoading(false);
      }
    }
  };

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runSearch(keyword);
  };

  const handleRecentSearch = (searchTerm: string) => {
    setKeyword(searchTerm);
    void runSearch(searchTerm);
  }

  useEffect(() => {
    const audio = audioRef.current;

    return () => {
      abortControllerRef.current?.abort();

      if (audio) {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      }
    };
  }, []);

  const handlePreview = async (track: ITunesTrack) => {
    const audio = audioRef.current;

    if (!audio || !track.previewUrl) {
      return;
    }

    const isCurrentPreview =
      playingPreviewTrackId === track.trackId;

    if (isCurrentPreview && !audio.paused) {
      stopPreview();
      return;
    }

    onPauseSoundCloud();

    audio.pause();
    audio.src = track.previewUrl;
    audio.currentTime = 0;

    try {
      await audio.play();
      setPlayingPreviewTrackId(track.trackId);
    } catch {
      setPlayingPreviewTrackId(null);
    }
  };

  const stopPreview = useCallback(() => {
    const audio = audioRef.current;

    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }

    setPlayingPreviewTrackId(null);
  }, []);

  const isSoundCloudPlaying = usePlayerStore(
    (state) => state.isPlaying
  );

  useEffect(() => {
    if (!isSoundCloudPlaying) return;

    stopPreview();
  }, [isSoundCloudPlaying, stopPreview]);

  return (
    <div className="mx-auto w-full px-2 lg:px-4 pb-6 lg:pb-10">
      <form onSubmit={handleSearch}>
        <div className="flex relative">
          <label htmlFor="music-search" className="inline-flex justify-center items-center absolute top-0 left-3.5 h-full">
            <span className="sr-only">검색어</span>
            <Music aria-hidden="true" className="size-4 md:size-6 text-textSub" />
          </label>

          <input
            id="music-search"
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            autoComplete="off"
            placeholder="Search songs or artists"
            className="music-search-input w-full py-3 md:py-4 pl-10 md:pl-14 pr-18 bg-background rounded-xl md:rounded-2xl text-textBase text-sm md:text-base border border-textThr dark:border-none focus:ring-primary"
          />
          {keyword && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setKeyword('')}
              className="inline-flex items-center absolute right-9 md:right-11 h-full px-2 md:px-4 text-textSub"
              aria-label="검색어 지우기"
            >
              <CircleX aria-hidden="true" className="size-4 md:size-5" />
            </button>
          )}

          <button type="submit"
            disabled={isLoading}
            aria-label={isLoading ? '검색 중...' : '검색'}
            className="inline-flex justify-center items-center absolute right-1 h-full px-4 rounded-full bg-none"
          >
            <SearchIcon aria-hidden="true" className="size-4 md:size-6" />
          </button>
        </div>

        {errorMessage && <p role="alert">{errorMessage}</p>}
      </form>

      {/* 검색어 목록 */}
      <div
        className={clsx(
          'flex lg:flex-wrap flex-col lg:flex-row gap-4 lg:mt-5 rounded-xl',
          'max-lg:mt-1 max-lg:p-4 max-lg:bg-background max-lg:shadow-md'
        )}
      >
        {/* 최근 검색어 */}
        {recentSearches.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-2 items-start lg:items-center max-lg:pb-3 max-lg:border-b max-lg:border-b-textThr">
            <p className="text-sm text-textSub">최근 검색어</p>
            <ul className="flex flex-wrap gap-2 max-lg:w-full max-lg:flex-col">
              {recentSearches.map((searchTerm) => (
                <li
                  key={searchTerm}
                  className="flex items-center gap-x-px lg:bg-textThr rounded-full hover:bg-primary/10"
                >
                  <button
                    type="button"
                    onClick={() => handleRecentSearch(searchTerm)}
                    className={clsx(
                      'group inline-flex items-center gap-x-1 lg:px-2 py-1.5',
                      'text-xs lg:text-sm hover:text-primary',
                      'max-lg:grow max-lg:pl-1'
                    )}
                  >
                    <Clock3 aria-hidden="true" className="size-4 text-textSub group-hover:text-primary" />
                    {searchTerm}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRecentSearch(searchTerm)}
                    onMouseDown={(e) => e.preventDefault()}
                    className="group shrink-0 inline-flex px-2 py-1 max-lg:py-px hover:text-primary"
                    aria-label={`${searchTerm} 최근 검색어 삭제`}
                  >
                    <XIcon aria-hidden="true" className="size-4 text-textSub group-hover:text-primary" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 추천 검색어 */}
        <div className={clsx('flex flex-col lg:flex-row gap-2 items-start lg:items-center')}>
          <p className="text-sm text-textSub">추천 검색어</p>
          {recommendedArtists.length > 0 && (
            <ul className="flex flex-wrap gap-2 max-lg:w-full max-lg:flex-col">
              {recommendedArtists.map((artist) => (
                <li
                  key={artist}
                  className="inline-flex items-center gap-x-2 lg:bg-textThr rounded-full text-textBase hover:bg-primary/10"
                >
                  <button
                    type="button"
                    onClick={() => handleRecentSearch(artist)}
                    className={clsx(
                      'group inline-flex items-center gap-x-1 relative lg:pl-3 lg:pr-4 py-1.5 text-xs lg:text-sm hover:text-primary',
                      'max-lg:w-full max-lg:pl-1'
                    )}
                  >
                    <Music2 aria-hidden="true" className="size-3 text-textSub group-hover:text-primary" />
                    {artist}
                    <ChevronRight aria-hidden="true" className="block lg:hidden size-3 absolute top-1/2 right-1.5 -translate-y-1/2 text-textSub group-hover:text-primary" />
                  </button>
                </li>

              ))}
            </ul>
          )}
        </div>
      </div>
      {/* //검색어 목록 */}


      <section className="mt-6" aria-labelledby="search-results-title">
        {!hasSearched && (
          <div className="flex flex-col items-center justify-center mb-5">
            <span className="mb-4">
              <AudioEqualizerIcon isPlaying={true} className="size-8 text-primary" />
            </span>
            <p className="text-center text-primary text-sm md:text-base">
              어떤 곡을 찾고 계신가요? <br className="inline md:hidden" />
              검색어를 입력하고 Enter를 눌러보세요.
            </p>
          </div>
        )}

        {isLoading && (
          <>
            <div className="flex gap-x-4 items-center mb-5">
              <h2 className="text-xl flex items-center gap-x-2">
                <SearchIcon aria-hidden="true" />
                <span>검색 중</span>
              </h2>
              <div
                className="animate-spin inline-block size-6 border-3 border-current border-t-transparent text-primary rounded-full"
                role="status"
                aria-label="loading"
              >
                <span className="sr-only">Loading...</span>
              </div>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-5 gap-x-4 gap-y-8 lg:gap-y-14 mt-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <TrackItemSkeleton key={i} />
              ))}
            </div>
          </>
        )}

        {!isLoading && errorMessage && (
          <p role="alert">{errorMessage}</p>
        )}

        {!isLoading &&
          !errorMessage &&
          hasSearched &&
          tracks.length === 0 && (
            <p className="text-center text-gray-500">검색 결과가 없어요.</p>
          )}

        {!isLoading && !errorMessage && tracks.length > 0 && (
          <>
            <div className="flex gap-x-4 items-center mb-8">
              <h2 id="search-results-title" className="text-base md:text-xl flex items-center gap-x-2 text-textSub">
                <SearchIcon aria-hidden="true" />
                <span>
                  검색 결과 “<strong className="font-inter font-black text-textBase">{searchKeyword}</strong>”
                </span>
              </h2>
            </div>
            <ul className="grid grid-cols-3 md:grid-cols-5 gap-x-4 gap-y-8 lg:gap-y-14 mt-6">
              {visibleTracks.map((track, index) => {
                const displayTrack = mapITunesTrackToPlayerTrack(track);
                const isPlayingPreview =
                  playingPreviewTrackId === track.trackId;

                return (
                  <li key={track.trackId} className="text-center">
                    <TrackItem
                      idx={index}
                      track={displayTrack}
                      interactive={Boolean(track.previewUrl)}
                      isPlayingPreview={isPlayingPreview}
                      onTrackClick={() => handlePreview(track)}
                      ariaLabel={
                        isPlayingPreview
                          ? `${track.trackName} 미리듣기 정지`
                          : `${track.trackName} 30초 미리듣기`
                      }
                      footerActions={
                        track.trackViewUrl ? (
                          <Tooltip content="Apple Music에서 원곡 보기" position="bottom" className="max-xl:hidden">
                            <a
                              href={track.trackViewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Apple Music에서 원곡 보기"
                              className="inline-flex mt-2.5 max-w-26"
                            >
                              <img src={appleMusicBadge} alt="Listen on Apple Music" />
                            </a>
                          </Tooltip>
                        ) : null
                      }
                    />
                  </li>
                );
              })}
            </ul>
            {hasMoreTracks && (
              <div className="flex justify-center mt-10">
                <button
                  type="button"
                  onClick={() => {
                    setVisibleCount((previousCount) =>
                      Math.min(
                        previousCount + LOAD_MORE_COUNT,
                        tracks.length
                      )
                    );
                  }}
                  className={clsx(
                    'inline-flex gap-1.5 items-center py-3 px-8 bg-background rounded-xl md:rounded-2xl',
                    'text-textBase text-sm border border-textThr dark:border-none focus:ring-primary',
                    'hover:text-primary transition-all'
                  )}
                >
                  20개 더 보기 <PlusIcon aria-hidden="true" className="size-3" />
                </button>
              </div>
            )}
          </>
        )}
        {/* audio */}
        <audio
          ref={audioRef}
          onEnded={() => setPlayingPreviewTrackId(null)}
        />
      </section>
    </div>
  );
}