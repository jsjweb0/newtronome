import clsx from "clsx";
import { Music2, Clock3, ChevronRight, X as XIcon } from "lucide-react";


interface SearchSuggestionsProps {
  recentSearches: string[];
  recommendedArtists: string[];
  onSelect: (searchTerm: string) => void;
  onRemoveRecent: (searchTerm: string) => void;
}

export default function SearchSuggestions({
  recentSearches,
  recommendedArtists,
  onSelect,
  onRemoveRecent
}: SearchSuggestionsProps) {
  return (
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
                  onClick={() => onSelect(searchTerm)}
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
                  onClick={() => onRemoveRecent(searchTerm)}
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
                  onClick={() => onSelect(artist)}
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
  )
}