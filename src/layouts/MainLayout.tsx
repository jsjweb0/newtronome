import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { getBoardTitle, ROUTES } from '../constants/routes';
import PageErrorBoundary from '../components/ui/PageErrorBoundary';
import { useSoundCloudWidget } from '../features/player/hooks/useSoundCloudWidget';
import { usePlayerStore } from '../features/player/stores/usePlayerStore';
import '../assets/css/index.css';
import Sidebar from '../components/layout/Sidebar';
import PlayerBar from '../components/layout/PlayerBar';
import PlaylistPanel from '../components/player/PlaylistPanel';
import Tooltip from '../components/ui/Tooltip';
import { PanelLeft } from 'lucide-react';
import PlayerBarSkeleton from '../components/layout/PlayerBarSkeleton';
import LoadingLogo from '../components/ui/LoadingLogo';
import clsx from 'clsx';
import DarkModeToggle from '../components/DarkModeToggle';
import type { PlayerTrack, PlaySingleTrackOptions } from '../features/player/types/player.types';
import { findPlaylistById, PLAYLISTS } from '../features/playlists/data/playlists';

const getPageTitle = (pathname: string) => {
  const [section, boardType, action] =
    pathname.split('/').filter(Boolean);

  if (section === 'playlists' && boardType) {
    // 두 번째 경로 조각이 플레이리스트 id
    let playlistId = boardType;
    try {
      playlistId = decodeURIComponent(boardType);
    } catch {
      // 잘못된 % 인코딩은 그대로 조회해서 '찾을 수 없음'으로 처리
    }

    return findPlaylistById(playlistId)?.title ?? '플레이리스트를 찾을 수 없음';
  }

  if (section === 'board') {
    const boardTitle = getBoardTitle(boardType);

    if (action === 'write') {
      return `${boardTitle} 글쓰기`;
    }

    if (action === 'edit') {
      return `${boardTitle} 게시글 수정`;
    }

    if (action) {
      return `${boardTitle} 게시글 상세`;
    }

    return boardTitle;
  }

  const matchedRoute = Object.values(ROUTES).find(
    ({ path }) => path === pathname
  );

  return matchedRoute?.title ?? '페이지를 찾을 수 없음';
};

export interface PlayerOutletContext {
  isSidebarCollapsed: boolean;

  playlistUrl: string;
  onSelectTrack: (index: number) => void;
  onToggleTrack: () => void;
  onPauseSoundCloud: () => void;
  onPlaySingleTrack: (
    track: PlayerTrack,
    options?: PlaySingleTrackOptions
  ) => void;

  playlistStatus: ReturnType<typeof useSoundCloudWidget>['playlistStatus'];
  widgetError: string | null;
  retryLoad: () => void;
}

export default function MainLayout() {
  const location = useLocation();

  useEffect(() => {
    document.title = `${getPageTitle(location.pathname)} | NEWTRONOME`;
  }, [location.pathname]);

  const [selectedPlaylist] = useState(() => {
    const randomIndex = Math.floor(Math.random() * PLAYLISTS.length);
    return PLAYLISTS[randomIndex];
  });
  const soundCloudWidget = useSoundCloudWidget(selectedPlaylist.soundCloudUrl);

  const tracks = usePlayerStore((state) => state.tracks);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const playbackMode = usePlayerStore((state) => state.playbackMode);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(true);
  const playlistToggleRef = useRef<HTMLButtonElement>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  const closePlaylistPanel = useCallback(() => {
    setIsPanelCollapsed(false);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1279px)');

    const syncViewport = (matches: boolean) => {
      setIsMobileViewport(matches);
      setIsPanelCollapsed(!matches);
    };

    syncViewport(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      syncViewport(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const isMobilePanelOpen = isMobileViewport && isPanelCollapsed;

  const outletContext: PlayerOutletContext = {
    isSidebarCollapsed,

    playlistUrl: selectedPlaylist.soundCloudUrl,
    onSelectTrack: soundCloudWidget.selectTrack,
    onToggleTrack: soundCloudWidget.toggle,
    onPauseSoundCloud: soundCloudWidget.pause,
    onPlaySingleTrack: soundCloudWidget.playSingleTrack,

    playlistStatus: soundCloudWidget.playlistStatus,
    widgetError: soundCloudWidget.widgetError,
    retryLoad: soundCloudWidget.retryLoad,
  };

  return (
    <div className="overflow-x-clip relative lg:pt-3 px-3 pb-27.5 xl:pb-35 text-textBase dark:bg-black">
      <a
        href="#main-content"
        inert={isMobilePanelOpen}
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-200 focus:rounded-lg focus:bg-background focus:px-4 focus:py-3 focus:text-textBase focus:shadow-lg"
      >
        본문 바로가기
      </a>
      {/* 왼쪽 사이드바 */}
      <header
        inert={isMobilePanelOpen}
        className={clsx(
          'z-50 lg:z-100 sticky lg:fixed top-0 lg:top-3 lg:left-3 lg:h-full lg:max-h-[calc(100%-1.5rem)] bg-background lg:p-3.5 rounded-xl transition-width duration-300',
          'border border-textThr dark:border-none',
          'has-[.open]:z-999',
          isSidebarCollapsed ? 'lg:w-19 lg:rounded-3xl' : 'lg:w-60 lg:rounded-2xl'
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
              aria-controls="navbar"
              aria-expanded={!isSidebarCollapsed}
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
          id="main-content"
          tabIndex={-1}
          inert={isMobilePanelOpen}
          className={clsx(
            'py-4 lg:py-10 transition-all duration-300',
            isPanelCollapsed ? 'xl:max-w-[calc(100%-300px-0.75rem)]' : 'xl:max-w-full'
          )}
        >
          <article className="min-h-[calc(100vh-162px)] xl:min-h-[calc(100vh-232px)] max-lg:mt-2">
            <PageErrorBoundary key={location.pathname}>
              <Suspense fallback={<LoadingLogo />}>
                <Outlet context={outletContext} />
              </Suspense>
            </PageErrorBoundary>
          </article>
        </main>

        {/* 오른쪽 고정 플레이리스트 패널 */}
        <PlaylistPanel
          playlistUrl={selectedPlaylist.soundCloudUrl}
          collapsed={isPanelCollapsed}
          tracks={tracks}
          onSelect={soundCloudWidget.selectTrack}
          isPlaying={isPlaying}
          isPlaylistMode={playbackMode === 'playlist'}
          soundCloudWidget={soundCloudWidget}
          isModal={isMobileViewport}
          onClose={closePlaylistPanel}
          toggleButtonRef={playlistToggleRef}
        />
      </div>
      {/* 하단 고정 플레이어 */}
      <footer
        inert={isMobilePanelOpen}
        className={clsx(
          'z-50 fixed left-3 bottom-3 w-full max-w-[calc(100%-1.5rem)] xl:h-29 bg-background/90 backdrop-blur-xs rounded-2xl transition-all',
          'border border-textThr dark:border-none',
          isSidebarCollapsed
            ? 'lg:left-25 lg:max-w-[calc(100%-7rem)]'
            : 'lg:left-[calc(240px+1.5rem)] lg:max-w-[calc(100%-240px-2.25rem)]'
        )}
      >
        {/* setCurrentTrackUrl(track.url) */}
        {!soundCloudWidget.isReady && soundCloudWidget.playlistStatus === 'loading' ? (
          <PlayerBarSkeleton />
        ) : (
          <PlayerBar
            onPanelToggle={() => setIsPanelCollapsed((current) => !current)}
            collapsed={isPanelCollapsed}
            soundCloudWidget={soundCloudWidget}
            panelToggleRef={playlistToggleRef}
          />
        )}
      </footer>
    </div>
  );
}
