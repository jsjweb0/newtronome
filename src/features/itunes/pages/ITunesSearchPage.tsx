import { FormEvent, useEffect, useState } from "react";
import { ITunesTrack } from "../types/itunes.types";
import { searchITunesTracks } from "../services/searchITunesTracks";
import { Music, Search as SearchIcon, CircleX, Music2, Clock3, ChevronRight, X as XIcon } from "lucide-react";
import clsx from "clsx";
import { AudioEqualizerIcon } from '../../../components/icons';
import TrackItemSkeleton from "../../../components/track/TrackItemSkeleton";
import appleMusicBadge from '../../../assets/brands/Apple_Music_Listen_on_Badge.svg';

const RECENT_KEY = 'recentSearches';

export default function ITunesSearchPage() {
  const [keyword, setKeyword] = useState('');
  const [tracks, setTracks] = useState<ITunesTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [hasSearched, setHasSearched] = useState(false);

  // 예시로 하드코딩한 추천 검색어
  const RECOMMENDED = ['Disco', 'French House', 'Nu Disco', 'Deep House'];
  const [recent, setRecent] = useState([]);

  // 마운트 시 localStorage에서 불러오기
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_KEY);
    if (stored) setRecent(JSON.parse(stored));
  }, []);

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setHasSearched(true);
    setIsLoading(true);
    setErrorMessage('');

    try {
      const searchResults = await searchITunesTracks(keyword);

      setTracks(searchResults);
    } catch {
      setTracks([]);
      setErrorMessage('검색 결과를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

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
            placeholder="Search"
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
        {recent.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-2 items-start lg:items-center max-lg:pb-3 max-lg:border-b max-lg:border-b-textThr">
            <p className="text-sm text-textSub">최근 검색어</p>
            <ul className="flex flex-wrap gap-2 max-lg:w-full max-lg:flex-col">
              {recent.map((term) => (
                <li
                  key={term}
                  className="flex items-center gap-x-px lg:bg-textThr rounded-full hover:bg-primary/10"
                >
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    className={clsx(
                      'group inline-flex items-center gap-x-1 lg:px-2 py-1.5 text-xs lg:text-sm hover:text-primary',
                      'max-lg:grow max-lg:pl-1'
                    )}
                  >
                    <Clock3 className="size-4 text-textSub group-hover:text-primary" />
                    {term}
                  </button>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    className="group shrink-0 inline-flex px-2 py-1 max-lg:py-px hover:text-primary"
                    aria-label={`${term} 삭제`}
                  >
                    <XIcon className="size-4 text-textSub group-hover:text-primary" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 추천 검색어 */}
        <div className={clsx('flex flex-col lg:flex-row gap-2 items-start lg:items-center')}>
          <p className="text-sm text-textSub">추천 검색어</p>
          <ul className="flex flex-wrap gap-2 max-lg:w-full max-lg:flex-col">
            {RECOMMENDED.map((term) => (
              <li
                key={term}
                className="inline-flex items-center gap-x-2 lg:bg-textThr rounded-full text-textBase hover:bg-primary/10"
              >
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  className={clsx(
                    'group inline-flex items-center gap-x-1 relative lg:px-3 py-1.5 text-xs lg:text-sm hover:text-primary ' +
                    'max-lg:w-full max-lg:pl-1'
                  )}
                >
                  <Music2 className="size-3 text-textSub group-hover:text-primary" />
                  {term}
                  <ChevronRight className="block lg:hidden size-3.5 absolute top-1/2 right-1.5 -translate-y-1/2 text-textSub" />
                </button>
              </li>
            ))}
          </ul>
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
                  검색 결과 “<strong className="font-inter font-black text-textBase">{keyword}</strong>”
                </span>
              </h2>
            </div>
            <ul className="grid grid-cols-3 md:grid-cols-5 gap-x-4 gap-y-8 lg:gap-y-14 mt-6">
              {tracks.map((track) => (
                <li key={track.trackId} className="text-center">
                  {track.artworkUrl100 && (
                    <span className="overflow-hidden block relative rounded-lg pt-[100%]">
                      <img
                        src={track.artworkUrl100}
                        alt=""
                        className="block object-cover w-full h-full transition-transform absolute top-0 left-0"
                      />
                    </span>
                  )}

                  <strong className="block max-lg:text-sm mt-3">{track.trackName}</strong>
                  <p className="text-xs lg:text-sm mt-1">{track.artistName}</p>

                  {track.collectionName && (
                    <p className="text-textSub text-xs lg:text-sm mt-1">{track.collectionName}</p>
                  )}

                  {track.trackViewUrl && (
                    <a
                      href={track.trackViewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Apple Music에서 원곡 보기"
                      className="inline-flex mt-2"
                    >
                      <img src={appleMusicBadge} alt="Listen on Apple Music" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}