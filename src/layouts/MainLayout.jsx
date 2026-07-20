import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import useSoundCloudApi from '../hooks/useSoundCloudApi';
import { usePlayerStore } from '../features/player/stores/usePlayerStore';
import '../assets/css/index.css';
import 'preline';
import Sidebar from '../components/layout/Sidebar.jsx';
import PlayerBar from '../components/layout/PlayerBar.jsx';
import PlaylistPanel from '../components/player/PlaylistPanel.jsx';
import Tooltip from '../components/ui/Tooltip.jsx';
import { PanelLeft } from 'lucide-react';
import PlayerBarSkeleton from '../components/layout/PlayerBarSkeleton.jsx';
import PlaylistPanelSkeleton from '../components/player/PlaylistPanelSkeleton.jsx';
import SearchPanel from '../components/player/SearchPanel.jsx';
import clsx from 'clsx';
import DarkModeToggle from '../components/DarkModeToggle.jsx';

export default function MainLayout() {
  const { loading, getPlaylistsByUrls } = useSoundCloudApi();

  const setPlaylist = usePlayerStore((state) => state.setPlaylist);
  const tracks = usePlayerStore((state) => state.tracks);
  const currentIndex = usePlayerStore((state) => state.currentIndex);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const selectTrack = usePlayerStore((state) => state.selectTrack);

  const navigate = useNavigate();
  const location = useLocation();
  const isSearchPage = location.pathname.startsWith('/search');

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(true);

  const handleReorder = (newOrder) => {
    const currentTrackId = tracks[currentIndex]?.id;
    const newIndex = newOrder.findIndex((t) => t.id === currentTrackId);
    setPlaylist(newOrder, newIndex);
  };

  useEffect(() => {
    const urls = [
      'https://soundcloud.com/ssu-1/sets/2025-summer',
      'https://soundcloud.com/ssu-1/sets/2024-spring',
      'https://soundcloud.com/ssu-1/sets/2023-spring',
      'https://soundcloud.com/ssu-1/sets/2022-summer',
      'https://soundcloud.com/ssu-1/sets/2020-spring',
      'https://soundcloud.com/ssu-1/sets/2019-spring',
      'https://soundcloud.com/ssu-1/sets/2018-disco',
      'https://soundcloud.com/ssu-1/sets/2017-summer',
      'https://soundcloud.com/ssu-1/sets/2017-spring',
      'https://soundcloud.com/ssu-1/sets/2017spring',
      'https://soundcloud.com/ssu-1/sets/m3stc8ixvqcw',
      'https://soundcloud.com/ssu-1/sets/lkuriahk4u4p',
      'https://soundcloud.com/ssu-1/sets/1j886wtueuzr',
      'https://soundcloud.com/ssu-1/sets/spring-disco',
      'https://soundcloud.com/ssu-1/sets/autumn-disco',
      'https://soundcloud.com/ssu-1/sets/summer-disco2',
      /* 추가 URL들… */
    ];

    const randomSubset = urls.sort(() => Math.random() - 0.5).slice(0, 2);
    getPlaylistsByUrls(randomSubset)
      .then((tracks) => {
        // 셔플하고 싶다면 여기서 셔플
        const shuffled = tracks.sort(() => Math.random() - 0.5).slice(0, 50);
        setPlaylist(shuffled, 0);
      })
      .catch(console.error);
    // searchTracks("house music").then(trs => setPlaylist(trs));
  }, [getPlaylistsByUrls, setPlaylist]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(max-width: 1280px)');
    const onChange = (e) => {
      if (e.matches) {
        // ≥xl → 항상 펼쳐두기
        setIsPanelCollapsed(false);
      } else {
        setIsPanelCollapsed(true);
      }
    };

    if (mql.matches) setIsPanelCollapsed(false);

    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return (
    <div className="relative lg:pt-3 px-3 pb-[110px] xl:pb-[140px] text-textBase dark:bg-black">
      {/* 왼쪽 사이드바 */}
      <header
        className={clsx(
          'z-50 lg:z-100 sticky lg:fixed top-0 lg:top-3 lg:left-3 lg:h-full lg:max-h-[calc(100%-1.5rem)] bg-background p-2 lg:p-3.5 rounded-xl transition-width duration-300',
          'border border-textThr dark:border-none',
          'has-[.open]:z-999',
          isSidebarCollapsed ? 'lg:w-19 lg:rounded-3xl' : 'lg:w-[240px] lg:rounded-2xl'
        )}
      >
        <Sidebar collapsed={isSidebarCollapsed} />
        <div className="absolute bottom-8 left-4 hidden lg:flex flex-col gap-y-2">
          <DarkModeToggle />
          <Tooltip
            content={`${isSidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}`}
            position="right"
          >
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="lg:flex items-center justify-center size-11 rounded-full text-textBase hover:text-primary hover:bg-primary/6"
              aria-label={isSidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
            >
              <PanelLeft className="size-6" />
            </button>
          </Tooltip>
        </div>
      </header>

      <div
        className={clsx(
          'transition-margin duration-300',
          isSidebarCollapsed ? 'lg:ml-22' : 'lg:ml-[calc(240px+0.75rem)]'
        )}
      >
        {/* 메인 콘텐츠 */}
        <main
          className={clsx(
            'transition-all duration-300',
            isPanelCollapsed ? 'xl:max-w-[calc(100%-300px-0.75rem)]' : 'xl:max-w-full'
          )}
        >
          <SearchPanel
            className="hidden lg:block"
            onSearch={(q) => {
              // 입력값 q 를 쿼리스트링에 담아 /search 로 이동
              navigate(`/search?q=${encodeURIComponent(q)}`);
            }}
            showSuggestions={isSearchPage}
          />
          <article className="min-h-[calc(100vh-162px)] xl:min-h-[calc(100vh-232px)] max-lg:mt-2">
            <Outlet />
          </article>
        </main>

        {/* 오른쪽 고정 플레이리스트 패널 */}
        {loading ? (
          <PlaylistPanelSkeleton />
        ) : (
          <PlaylistPanel
            collapsed={isPanelCollapsed}
            tracks={tracks}
            currentIndex={currentIndex}
            onSelect={selectTrack}
            onReorder={handleReorder}
            isPlaying={isPlaying}
          />
        )}
      </div>
      {/* 하단 고정 플레이어 */}
      <footer
        className={clsx(
          'z-100 xl:z-50 fixed left-3 bottom-3 w-full max-w-[calc(100%-1.5rem)] xl:h-29 bg-background/90 backdrop-blur-xs rounded-2xl transition-all',
          'border border-textThr dark:border-none',
          isSidebarCollapsed
            ? 'lg:left-25 lg:max-w-[calc(100%-7rem)]'
            : 'lg:left-[calc(240px+1.5rem)] lg:max-w-[calc(100%-240px-2.25rem)]'
        )}
      >
        {/* setCurrentTrackUrl(track.url) */}
        {loading ? (
          <PlayerBarSkeleton />
        ) : (
          <PlayerBar
            onPanelToggle={() => setIsPanelCollapsed((c) => !c)}
            collapsed={isPanelCollapsed}
          />
        )}
      </footer>
    </div>
  );
}
