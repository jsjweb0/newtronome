import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ITunesTrack } from "../types/itunes.types";
import { useITunesSearch } from "../hooks/useITunesSearch";
import { Music, Search as SearchIcon, X as XIcon, Plus as PlusIcon } from "lucide-react";
import clsx from "clsx";
import { AudioEqualizerIcon } from '../../../components/icons';
import TrackItemSkeleton from "../../../components/track/TrackItemSkeleton";
import { useOutletContext } from "react-router-dom";
import type { PlayerOutletContext } from "../../../layouts/MainLayout";
import { usePlayerStore } from "../../player/stores/usePlayerStore";
import ArtistTracksPanel from "../components/ArtistTracksPanel";
import SearchSuggestions from "../components/SearchSuggestions";
import SearchResultCard from "../components/SearchResultCard";
import { useToast } from "../../../contexts/ToastContext";

const RECENT_SEARCHES_KEY = 'recentSearches';
const MAX_RECENT_SEARCHES = 5;
const INITIAL_VISIBLE_COUNT = 20;
const LOAD_MORE_COUNT = 20;

interface SelectedArtist {
  id: number;
  name: string;
}

export default function ITunesSearchPage() {
  const { onPauseSoundCloud } = useOutletContext<PlayerOutletContext>();

  const { showToast } = useToast();

  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  const searchQuery = useITunesSearch(searchKeyword);

  const tracks = searchQuery.data ?? [];
  const isLoading = searchQuery.isFetching;
  const hasSearched = searchKeyword !== null;
  const errorMessage = searchQuery.isError ? '검색 결과를 불러오지 못했습니다.' : '';

  const visibleTracks = tracks.slice(0, visibleCount);
  const hasMoreTracks = visibleCount < tracks.length;

  const audioRef = useRef<HTMLAudioElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [areSuggestionsDismissed, setAreSuggestionsDismissed] = useState(false);
  const [isDesktopSearch, setIsDesktopSearch] = useState(false);

  const [playingPreviewTrackId, setPlayingPreviewTrackId] = useState<number | null>(null);

  const playlistTracks = usePlayerStore((state) => state.tracks);
  const [recommendedArtists, setRecommendedArtists] = useState<string[]>([]);

  const previewRequestIdRef = useRef(0);
  const notifiedPreviewRequestIdRef = useRef<number | null>(null);

  const [selectedArtist, setSelectedArtist] = useState<SelectedArtist | null>(null);
  const [isArtistPanelOpen, setIsArtistPanelOpen] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const updateIsDesktopSearch = () => setIsDesktopSearch(mediaQuery.matches);

    updateIsDesktopSearch();
    mediaQuery.addEventListener('change', updateIsDesktopSearch);

    return () => mediaQuery.removeEventListener('change', updateIsDesktopSearch);
  }, []);

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

  const saveRecentSearch = useCallback((searchTerm: string) => {
    const trimmedSearchTerm = searchTerm.trim();

    if (!trimmedSearchTerm) {
      return;
    }

    setRecentSearches((previousSearches) =>
      [
        trimmedSearchTerm,
        ...previousSearches.filter(
          (term) =>
            term.toLowerCase() !== trimmedSearchTerm.toLowerCase()
        ),
      ].slice(0, MAX_RECENT_SEARCHES)
    );
  }, []);

  useEffect(() => {
    if (searchKeyword === null || searchQuery.dataUpdatedAt === 0) {
      return;
    }

    saveRecentSearch(searchKeyword);
  }, [searchKeyword, searchQuery.dataUpdatedAt, saveRecentSearch]);

  const removeRecentSearch = (searchTerm: string) => {
    setRecentSearches((previousSearches) =>
      previousSearches.filter((term) => term !== searchTerm)
    );
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  useEffect(() => {
    try {
      localStorage.setItem(
        RECENT_SEARCHES_KEY,
        JSON.stringify(recentSearches)
      );
    } catch {
      // 저장 실패가 음악 검색 결과에 영향을 주지 않게 한다.
    }
  }, [recentSearches]);

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

  const runSearch = (searchTerm: string) => {
    const trimmedKeyword = searchTerm.trim();

    if (!trimmedKeyword) return;

    stopPreview();
    setIsArtistPanelOpen(false);
    // 검색하면 모바일 검색어 패널을 닫고 키보드도 내린다
    searchInputRef.current?.blur();
    setIsSearchFocused(false);
    setAreSuggestionsDismissed(!isDesktopSearch);
    setVisibleCount(INITIAL_VISIBLE_COUNT);

    if (trimmedKeyword === searchKeyword) {
      void searchQuery.refetch();
      return;
    }

    setSearchKeyword(trimmedKeyword);
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runSearch(keyword);
  };

  const handleRecentSearch = (searchTerm: string) => {
    setKeyword(searchTerm);
    runSearch(searchTerm);
  }

  useEffect(() => {
    const audio = audioRef.current;

    return () => {
      previewRequestIdRef.current += 1;

      if (audio) {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      }
    };
  }, []);

  const notifyPreviewFailure = (requestId: number) => {
    // 이미 다른 곡을 선택했거나 재생을 중단했다면 무시
    if (previewRequestIdRef.current !== requestId) {
      return;
    }

    // 같은 요청의 실패를 이미 안내했다면 무시
    if (notifiedPreviewRequestIdRef.current === requestId) {
      return;
    }

    notifiedPreviewRequestIdRef.current = requestId;
    setPlayingPreviewTrackId(null);

    showToast({
      message: '미리듣기를 재생하지 못했습니다. 다시 눌러 재시도해 주세요.',
      type: 'error',
    });
  };

  const handlePreview = async (track: ITunesTrack) => {
    const audio = audioRef.current;
    const requestId = ++previewRequestIdRef.current;

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

      if (previewRequestIdRef.current !== requestId) {
        return;
      }

      setPlayingPreviewTrackId(track.trackId);

    } catch (error) {
      // 이전 요청 실패
      if (previewRequestIdRef.current !== requestId) {
        return;
      }

      // 재생 중단으로 생긴 오류는 안내하지 않음
      if (error instanceof DOMException && error.name === 'AbortError') {
        setPlayingPreviewTrackId(null);
        return;
      }

      notifyPreviewFailure(requestId);
    }
  };

  const handlePreviewError = () => {
    const audio = audioRef.current;

    // 정지하면서 src를 지웠거나 현재 미디어 오류가 없으면 무시
    if (!audio || !audio.hasAttribute('src') || !audio.error) {
      return;
    }

    // 미디어 로딩이 중단된 경우는 안내하지 않음
    if (audio.error.code === MediaError.MEDIA_ERR_ABORTED) {
      return;
    }

    notifyPreviewFailure(previewRequestIdRef.current);
  };

  const stopPreview = useCallback(() => {
    const audio = audioRef.current;

    previewRequestIdRef.current += 1;

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

  const areSuggestionsOpen =
    !areSuggestionsDismissed &&
    (isDesktopSearch || !hasSearched || isSearchFocused);

  const dismissSuggestions = () => {
    setAreSuggestionsDismissed(!isDesktopSearch);
    searchInputRef.current?.focus();
  };

  return (
    <div className="relative mx-auto w-full px-1 md:px-7 pb-6 lg:pb-10">
      {/* 게시판(Notice · Free Board)과 같은 페이지 제목 */}
      <div className="flex items-center gap-3 mb-4 md:mb-5">
        <SearchIcon aria-hidden="true" className="shrink-0 size-6.5 text-primary" />
        <div>
          <h1 className="text-[28px] leading-tight font-extrabold tracking-tight text-textBase">
            Search
          </h1>
          <p className="mt-0.5 text-[13px] text-textSub">음악 검색 · 30초 미리듣기</p>
        </div>
      </div>

      <form role="search" onSubmit={handleSearch}>
        <div
          className={clsx(
            'flex items-center gap-2.5 min-h-14.5 pr-1.5 pl-4 rounded-[18px] bg-field',
            'border border-textThr dark:border-line focus-within:border-primary transition-colors'
          )}
        >
          <label htmlFor="music-search" className="flex shrink-0 text-textSub">
            <span className="sr-only">검색어</span>
            <Music aria-hidden="true" className="size-5" />
          </label>

          <input
            ref={searchInputRef}
            id="music-search"
            type="search"
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value);
              setAreSuggestionsDismissed(false);
            }}
            onFocus={() => {
              setIsSearchFocused(true);
              setAreSuggestionsDismissed(false);
            }}
            onBlur={() => setIsSearchFocused(false)}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && areSuggestionsOpen) {
                event.preventDefault();
                dismissSuggestions();
              }
            }}
            autoComplete="off"
            placeholder="Search songs or artists"
            role="combobox"
            aria-autocomplete="none"
            aria-haspopup="dialog"
            aria-controls="search-suggestions"
            aria-expanded={areSuggestionsOpen}
            className="music-search-input min-w-0 flex-1 min-h-11 border-0 bg-transparent px-0 text-textBase text-base placeholder:text-textSub/70 outline-none focus:ring-0"
          />
          {keyword && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setKeyword('')}
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-textSub hover:bg-textThr/60 hover:text-textBase"
              aria-label="검색어 지우기"
            >
              <XIcon aria-hidden="true" className="size-4.5" />
            </button>
          )}

          <button type="submit"
            disabled={isLoading}
            aria-label={isLoading ? '검색 중...' : '검색'}
            className={clsx(
              'flex size-11 shrink-0 items-center justify-center rounded-xl text-textBase hover:bg-textThr/60',
              'lg:rounded-[10px] lg:bg-primary lg:text-onPrimary lg:hover:bg-primary/85',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60'
            )}
          >
            <SearchIcon aria-hidden="true" className="size-5" />
          </button>
        </div>
      </form>

      {/* 검색어 목록 */}
      <SearchSuggestions
        id="search-suggestions"
        recentSearches={recentSearches}
        recommendedArtists={recommendedArtists}
        isMobilePanelOpen={areSuggestionsOpen}
        onSelect={handleRecentSearch}
        onRemoveRecent={removeRecentSearch}
        onClearRecent={clearRecentSearches}
        onEscape={dismissSuggestions}
      />
      {/* //검색어 목록 */}

      <section className="mt-6 lg:mt-8" aria-labelledby="search-results-title">
        {!hasSearched && (
          <div className="flex flex-col items-center gap-2.5 px-4 pt-7 pb-10 text-center">
            <AudioEqualizerIcon isPlaying={true} size={56} aria-hidden="true" className="text-primary" />
            <p className="mt-1.5 text-base font-bold text-textBase">어떤 곡을 찾고 계신가요?</p>
            <p className="text-[13px] leading-normal text-textSub">
              검색어를 입력하고 Enter를 눌러보세요.
            </p>
          </div>
        )}

        {isLoading && (
          <>
            <div className="flex gap-x-3 items-center mb-5">
              <h2 className="text-lg md:text-[22px] font-bold flex items-center gap-x-2">
                <SearchIcon aria-hidden="true" className="size-5" />
                <span>검색 중</span>
              </h2>
              <div
                className="animate-spin inline-block size-5 border-3 border-current border-t-transparent text-primary rounded-full"
                role="status"
                aria-label="loading"
              >
                <span className="sr-only">Loading...</span>
              </div>
            </div>

            <div className={resultGridClassName}>
              {Array.from({ length: 10 }).map((_, i) => (
                <TrackItemSkeleton key={i} />
              ))}
            </div>
          </>
        )}

        {!isLoading && errorMessage && (
          <p role="alert" className="py-10 text-center text-textSub">{errorMessage}</p>
        )}

        {!isLoading &&
          !errorMessage &&
          hasSearched &&
          tracks.length === 0 && (
            <p className="py-10 text-center text-textSub">검색 결과가 없어요.</p>
          )}

        {!isLoading && !errorMessage && tracks.length > 0 && (
          <>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 mb-5.5">
              <SearchIcon aria-hidden="true" className="size-5 text-textBase" />
              <h2 id="search-results-title" className="text-lg md:text-[22px] font-bold text-textBase">
                검색 결과 <span className="text-primary">“{searchKeyword}”</span>
              </h2>
              <span className="text-[13px] text-textSub">{tracks.length}곡 · 30초 미리듣기</span>
            </div>
            <ul className={resultGridClassName}>
              {visibleTracks.map((track) => (
                <li key={track.trackId} className="min-w-0">
                  <SearchResultCard
                    track={track}
                    isPlayingPreview={playingPreviewTrackId === track.trackId}
                    onPreview={handlePreview}
                    onOpenArtist={(selectedTrack) => {
                      setSelectedArtist({
                        id: selectedTrack.artistId,
                        name: selectedTrack.artistName,
                      });
                      setIsArtistPanelOpen(true);
                    }}
                  />
                </li>
              ))}
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
                    'inline-flex gap-1.5 items-center min-h-11 px-8 bg-field rounded-xl',
                    'text-textBase text-sm border border-textThr dark:border-line',
                    'hover:text-primary hover:border-primary transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-primary'
                  )}
                >
                  20개 더 보기 <PlusIcon aria-hidden="true" className="size-3.5" />
                </button>
              </div>
            )}
          </>
        )}

        {/* 다른 곡 보기 */}
        <ArtistTracksPanel
          artist={selectedArtist}
          isOpen={isArtistPanelOpen}
          playingTrackId={playingPreviewTrackId}
          onClose={() => {
            stopPreview();
            setIsArtistPanelOpen(false);
          }}
          onPreview={handlePreview}
        />
        {/* // 다른 곡 보기 */}

        {/* audio */}
        {/* 순수 음악 30초 미리듣기로, 음성 콘텐츠용 자막 트랙을 제공하지 않는다. */}
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio
          ref={audioRef}
          onEnded={() => setPlayingPreviewTrackId(null)}
          onError={handlePreviewError}
        />
      </section>
    </div>
  );
}

const resultGridClassName = clsx(
  'grid grid-cols-2 gap-x-3 gap-y-5.5',
  'md:grid-cols-[repeat(auto-fill,minmax(176px,1fr))] md:gap-x-5 md:gap-y-7'
);
