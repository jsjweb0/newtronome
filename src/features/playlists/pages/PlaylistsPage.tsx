import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PlaylistCard from '../components/PlaylistCard';
import { PLAYLISTS } from '../data/playlists';
import { CircleX } from 'lucide-react';

export default function PlaylistsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get('q') ?? '';
  const [draftFilter, setDraftFilter] = useState(filter);
  const isComposingRef = useRef(false);

  useEffect(() => {
    if (!isComposingRef.current) {
      setDraftFilter(filter);
    }
  }, [filter]);

  const handleFilterChange = (value: string) => {
    setSearchParams(
      (params) => {
        const next = new URLSearchParams(params);
        if (value) next.set('q', value);
        else next.delete('q');
        return next;
      },
      { replace: true }
    );
  };

  const keyword = draftFilter.trim().toLowerCase();
  const filteredPlaylists = useMemo(
    () =>
      PLAYLISTS.filter(
        (playlist) => !keyword || playlist.title.toLowerCase().includes(keyword)
      ),
    [keyword]
  );

  const countLabel = keyword
    ? `${filteredPlaylists.length} / ${PLAYLISTS.length}개`
    : `${PLAYLISTS.length}개`;

  return (
    <section
      aria-labelledby="playlists-title"
      className="mx-auto w-full px-1 md:px-7 pb-6 lg:pb-10"
    >
      <header className="flex flex-wrap items-end justify-between gap-3 mb-6 md:mb-8">
        <div className="flex flex-col gap-1">
          <p className="font-inter text-xs font-extrabold tracking-[0.14em] text-primary">
            COLLECTION
          </p>
          <div className="flex items-baseline gap-2.5">
            <h1
              id="playlists-title"
              className="text-[28px] leading-tight font-extrabold tracking-tight text-textBase"
            >
              Playlists
            </h1>
            <span className="text-[13px] text-textSub tabular-nums" aria-live="polite">
              {countLabel}
            </span>
          </div>
        </div>

        <div className="relative">
          <label htmlFor="search-playlist-input" className="sr-only">플레이리스트 검색</label>
          <input
            type="search"
            id="search-playlist-input"
            value={draftFilter}
            onCompositionStart={() => {
              isComposingRef.current = true;
            }}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setDraftFilter(value);

              if (!isComposingRef.current) {
                handleFilterChange(value);
              }
            }}
            onCompositionEnd={(event) => {
              const value = event.currentTarget.value;
              isComposingRef.current = false;
              setDraftFilter(value);
              handleFilterChange(value);
            }}
            placeholder="Filter"
            autoComplete="off"
            className={
              'w-full md:w-50 min-h-11 pl-3.5 pr-8 rounded-[10px] border border-textThr dark:border-line bg-field ' +
              'text-sm text-textBase placeholder:text-textSub/70 outline-none focus:border-primary focus:ring-0 transition-colors'
            }
          />
          {draftFilter !== '' && (
            <button
              type="button"
              onClick={() => {
                setDraftFilter('');
                handleFilterChange('');
              }}
              className="inline-flex items-center justify-center absolute top-0 right-0 h-full w-10 text-textSub hover:text-textBase"
              aria-label="검색어 삭제"
            >
              <CircleX className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </header>

      {filteredPlaylists.length > 0 ? (
        <ul
          aria-label="플레이리스트 목록"
          className="grid grid-cols-2 gap-x-3.5 gap-y-7 md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] md:gap-x-5 md:gap-y-8"
        >
          {filteredPlaylists.map((playlist) => (
            <li key={playlist.id} className="min-w-0">
              <PlaylistCard playlist={playlist} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-10 text-center text-sm text-textSub">
          “{draftFilter.trim()}”에 맞는 플레이리스트가 없습니다.
        </p>
      )}
    </section>
  );
}
