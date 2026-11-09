import clsx from "clsx";
import { Music2, Clock3, ChevronRight, X as XIcon } from "lucide-react";
import type { KeyboardEvent } from 'react';

interface SearchSuggestionsProps {
  id?: string;
  recentSearches: string[];
  recommendedArtists: string[];
  /** 모바일에서 카드 패널을 보여줄지. 데스크톱(lg 이상)은 항상 칩으로 보인다 */
  isMobilePanelOpen: boolean;
  onSelect: (searchTerm: string) => void;
  onRemoveRecent: (searchTerm: string) => void;
  onClearRecent: () => void;
  onEscape: () => void;
}

/**
 * 최근 · 추천 검색어.
 * 모바일은 검색창 아래 카드 하나에 목록으로, 데스크톱은 한 줄씩 칩으로 보여준다.
 */
export default function SearchSuggestions({
  id,
  recentSearches,
  recommendedArtists,
  isMobilePanelOpen,
  onSelect,
  onRemoveRecent,
  onClearRecent,
  onEscape,
}: SearchSuggestionsProps) {
  const hasRecent = recentSearches.length > 0;
  const hasRecommended = recommendedArtists.length > 0;
  const handleSuggestionKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onEscape();
    }
  };

  return (
    <div
      id={id}
      role="dialog"
      aria-label="검색 제안"
      className={clsx(
        'flex flex-col',
        'max-lg:mt-2.5 max-lg:rounded-[18px] max-lg:border max-lg:border-line max-lg:bg-background max-lg:px-2 max-lg:pt-4.5 max-lg:pb-2.5',
        'lg:mt-5 lg:gap-3',
        !isMobilePanelOpen && 'hidden'
      )}
    >
      {/* 최근 검색어 */}
      <section
        aria-labelledby="recent-searches-title"
        className="flex flex-col lg:flex-row lg:flex-wrap lg:items-center lg:gap-2"
      >
        <div className="flex items-center justify-between max-lg:pr-2.5 max-lg:pb-1.5 max-lg:pl-3">
          <h2
            id="recent-searches-title"
            className="text-sm lg:min-w-18 lg:text-[13px] font-bold text-textSub"
          >
            최근 검색어
          </h2>
          {hasRecent && (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onKeyDown={handleSuggestionKeyDown}
              onClick={onClearRecent}
              className="min-h-11 px-1.5 text-xs text-textSub hover:text-textBase lg:hidden"
            >
              전체 삭제
            </button>
          )}
        </div>

        {hasRecent ? (
          <ul className="flex flex-col lg:flex-row lg:flex-wrap lg:gap-2">
            {recentSearches.map((searchTerm) => (
              <li
                key={searchTerm}
                className={clsx(
                  'flex items-center rounded-xl hover:bg-textThr/60',
                  'lg:h-11 lg:rounded-full lg:bg-field lg:hover:bg-primary/10'
                )}
              >
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onKeyDown={handleSuggestionKeyDown}
                  onClick={() => onSelect(searchTerm)}
                  aria-label={`${searchTerm} 다시 검색`}
                  className={clsx(
                    'group flex min-w-0 flex-1 items-center gap-3 min-h-12 pr-1 pl-3 text-left text-[15px] text-textBase',
                    'lg:min-h-11 lg:gap-1.5 lg:pl-3.5 lg:text-[13px] hover:text-primary'
                  )}
                >
                  <Clock3 aria-hidden="true" className="size-4.5 lg:size-4 shrink-0 text-textSub group-hover:text-primary" />
                  <span className="truncate">{searchTerm}</span>
                </button>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onKeyDown={handleSuggestionKeyDown}
                  onClick={() => onRemoveRecent(searchTerm)}
                  aria-label={`${searchTerm} 최근 검색어 삭제`}
                  className="group flex size-11 shrink-0 items-center justify-center rounded-full text-textSub hover:text-primary lg:mr-0.5"
                >
                  <XIcon aria-hidden="true" className="size-4.5 lg:size-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-3 pt-2.5 pb-3 text-[13px] text-textSub lg:p-0">
            최근 검색어가 없어요
          </p>
        )}
      </section>

      {/* 추천 검색어 */}
      {hasRecommended && (
        <>
          <div aria-hidden="true" className="mx-3 mt-2.5 mb-3.5 h-px bg-textThr lg:hidden" />
          <section
            aria-labelledby="recommended-searches-title"
            className="flex flex-col lg:flex-row lg:flex-wrap lg:items-center lg:gap-2"
          >
            <h2
              id="recommended-searches-title"
              className="px-3 pb-1.5 text-sm lg:min-w-18 lg:p-0 lg:text-[13px] font-bold text-textSub"
            >
              추천 검색어
            </h2>
            <ul className="flex flex-col lg:flex-row lg:flex-wrap lg:gap-2">
              {recommendedArtists.map((artist) => (
                <li
                  key={artist}
                  className="rounded-xl hover:bg-textThr/60 lg:rounded-full lg:bg-field lg:hover:bg-primary/10"
                >
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onKeyDown={handleSuggestionKeyDown}
                    onClick={() => onSelect(artist)}
                    className={clsx(
                      'group flex w-full items-center gap-3 min-h-12 pr-3.5 pl-3 text-left text-[15px] text-textBase hover:text-primary',
                      'lg:min-h-11 lg:gap-1.5 lg:pr-4 lg:pl-3.5 lg:text-[13px]'
                    )}
                  >
                    <Music2 aria-hidden="true" className="size-4.5 lg:size-4 shrink-0 text-primary lg:text-textSub lg:group-hover:text-primary" />
                    <span className="min-w-0 flex-1 truncate">{artist}</span>
                    <ChevronRight aria-hidden="true" className="size-4.5 shrink-0 text-textSub group-hover:text-primary lg:hidden" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
