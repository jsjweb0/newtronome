import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import PlaylistCard from '../components/PlaylistCard';
import { PLAYLISTS } from '../data/playlists';

// 탐색 페이지라서 재생 상태(Zustand 재생 목록 · 위젯)는 읽지도 바꾸지도 않음
export default function PlaylistsPage() {
  // 필터를 주소(?q=)에 두어 상세에서 뒤로 가기로 돌아와도 유지
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get('q') ?? '';

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

  const keyword = filter.trim().toLowerCase();
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

        <input
          type="search"
          value={filter}
          onChange={(event) => handleFilterChange(event.target.value)}
          aria-label="플레이리스트 검색"
          placeholder="Filter"
          autoComplete="off"
          className={
            'w-full md:w-50 min-h-11 px-3.5 rounded-[10px] border border-textThr dark:border-line bg-field ' +
            'text-sm text-textBase placeholder:text-textSub/70 outline-none focus:border-primary focus:ring-0 transition-colors'
          }
        />
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
          “{filter.trim()}”에 맞는 플레이리스트가 없습니다.
        </p>
      )}
    </section>
  );
}
