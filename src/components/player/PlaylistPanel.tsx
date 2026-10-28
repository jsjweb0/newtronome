import { toHighResArtwork } from '../../utils/image';
import { formatTime } from '../../utils/format';
import HeaderButtons from '../layout/HeaderButtons';
import { AudioEqualizerIcon } from '../icons';
import { ListMusic, Play, X as XIcon } from 'lucide-react';
import noImage from '../../assets/no-image.png';
import clsx from 'clsx';
import SoundCloudWidget from '../../features/player/components/SoundCloudWidget';
import soundCloudFaviconBlack from '../../assets/brands/soundcloud-favicon-black.webp';
import soundCloudFaviconWhite from '../../assets/brands/soundcloud-favicon-white.webp';
import Tooltip from '../ui/Tooltip';
import type { PlayerTrack } from '../../features/player/types/player.types';
import type { useSoundCloudWidget } from '../../features/player/hooks/useSoundCloudWidget';
import TrackBookmarkButton from '../../features/bookmarks/components/TrackBookmarkButton';
import RetryErrorState from '../ui/RetryErrorState';
import { RefObject, useEffect, useRef } from 'react';

interface PlaylistPanelProps {
  playlistUrl: string;
  tracks: PlayerTrack[];
  onSelect: (index: number) => void;
  collapsed: boolean;
  isPlaying: boolean;
  isPlaylistMode: boolean;
  soundCloudWidget: ReturnType<typeof useSoundCloudWidget>;
  isModal: boolean;
  onClose: () => void;
  toggleButtonRef: RefObject<HTMLButtonElement | null>;
}

export default function PlaylistPanel({
  playlistUrl,
  tracks,
  onSelect,
  collapsed,
  isPlaying,
  isPlaylistMode,
  soundCloudWidget,
  isModal,
  onClose,
  toggleButtonRef,
}: PlaylistPanelProps) {
  const widgetTrack = soundCloudWidget.widgetTrack;
  const playlistTrack =
    tracks.find((track) => String(track.id) === String(widgetTrack?.id)) ?? widgetTrack;
  const genre = playlistTrack?.genre?.trim() ?? '';
  const tags = (playlistTrack?.tags ?? []).filter((tag, index, tagList) => {
    const normalizedTag = tag.trim().toLowerCase();

    return (
      normalizedTag &&
      normalizedTag !== genre.toLowerCase() &&
      tagList.findIndex((item) => item.trim().toLowerCase() === normalizedTag) === index
    );
  });

  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isModal || !collapsed) return;

    const panel = panelRef.current;
    const closeButton = closeButtonRef.current;
    const toggleButton = toggleButtonRef.current;

    closeButton?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !panel) return;

      const focusableElements = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), ' +
          'select:not([disabled]), textarea:not([disabled]), ' +
          '[tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => element.offsetParent !== null);

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        event.preventDefault();
        panel.focus();
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === lastElement
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    panel?.addEventListener('keydown', handleKeyDown);

    return () => {
      panel?.removeEventListener('keydown', handleKeyDown);
      toggleButton?.focus();
    };
  }, [
    collapsed,
    isModal,
    onClose,
    toggleButtonRef,
  ]);

  return (
    <>
      <aside
        ref={panelRef}
        id="playlist-panel"
        role={isModal ? 'dialog' : undefined}
        aria-modal={isModal ? true : undefined}
        aria-labelledby="playlist-panel-title"
        tabIndex={isModal ? -1 : undefined}
        className={clsx(
          'z-51 fixed top-0 lg:top-3 right-0 lg:right-3 h-full xl:max-h-[calc(100%-116px-2.25rem)] transform transition-transform duration-300 w-full max-w-md lg:max-w-75 rounded-2xl',
          isModal ? 'z-160' : 'z-51',
          collapsed ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* widget */}
        <div
          className="absolute -left-2500 top-0 w-75 h-750 overflow-hidden opacity-0 pointer-events-none"
          aria-hidden="true"
        >
          <SoundCloudWidget playlistUrl={playlistUrl} controller={soundCloudWidget} />
        </div>
        {/* // widget */}
        <div className={`flex flex-col gap-3 h-full ${collapsed ? '' : 'hidden'}`}>
          <div
            className={clsx(
              'hidden lg:block shrink-0 z-2 relative px-4 py-2 bg-background rounded-2xl transition-transform transition-duration-350',
              'border border-textThr dark:border-none',
              collapsed ? 'translate-x-0' : 'translate-x-[calc(100%-4.5rem)]'
            )}
          >
            <HeaderButtons collapsed={collapsed} />
          </div>
          <div
            className={clsx(
              'overflow-y-auto grow relative bg-background rounded-2xl scrollbar transition-all transition-duration-600',
              'max-xl:pb-28',
              'border border-textThr dark:border-none',
              collapsed ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
            )}
          >
            {isModal && (
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="플레이리스트 닫기"
                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-background"
              >
                <XIcon aria-hidden="true" className="size-5" />
              </button>
            )}

            <h2
              id="playlist-panel-title"
              className="sr-only"
            >
              현재 재생 중인 곡과 플레이리스트
            </h2>

            {/* top cover*/}
            <div className="flex flex-col gap-y-1 p-4">
              <div className="mb-2">
                <img
                  src={toHighResArtwork(playlistTrack?.artworkUrl)}
                  alt={playlistTrack?.title || '플레이리스트 트랙'}
                  className="w-full rounded-2xl object-cover"
                  onError={(event) => {
                    event.currentTarget.src = noImage;
                    event.currentTarget.onerror = null;
                  }}
                />
              </div>
              {playlistTrack ? (
                <>
                  {playlistTrack.permalinkUrl ? (
                    <Tooltip content="SoundCloud에서 듣기" className="max-xl:hidden">
                      <a
                        href={playlistTrack.permalinkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${playlistTrack.title} 원곡을 SoundCloud에서 열기 (새 창)`}
                        className="relative inline-flex flex-col hover:text-primary"
                      >
                        <span>
                          <img
                            src={soundCloudFaviconBlack}
                            alt=""
                            className="size-7 object-contain dark:hidden"
                          />
                          <img
                            src={soundCloudFaviconWhite}
                            alt=""
                            className="hidden size-7 object-contain dark:block"
                          />
                        </span>
                        <strong className="font-black">{playlistTrack.title}</strong>
                      </a>
                    </Tooltip>
                  ) : (
                    <strong className="font-black">{playlistTrack.title}</strong>
                  )}

                  <div className="mt-1">{playlistTrack.artist}</div>
                  <div className="flex items-center gap-x-2.5 mt-4 text-xs text-textSub">
                    <TrackBookmarkButton
                      track={playlistTrack}
                      className="size-8 rounded-lg border border-textThr dark:border-none dark:bg-textThr text-textBase"
                      iconClassName="size-4!"
                    />
                    Likes
                    <div className="w-px h-px rounded-full bg-textSub"></div>
                    <div className="flex items-center gap-1.5">
                      <Play className="size-3 fill-textBase stroke-none" />
                      {formatTime(playlistTrack.durationMs)}
                    </div>
                  </div>
                </>
              ) : soundCloudWidget.playlistStatus === 'loading' ? (
                <div
                  className="space-y-2 animate-pulse"
                  role="status"
                  aria-label="트랙 정보 불러오는 중"
                >
                  <div className="size-7 rounded bg-gray-200 dark:bg-neutral-700" />
                  <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-neutral-700" />
                  <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-neutral-700" />
                  <div className="mt-4 h-8 w-1/2 rounded bg-gray-200 dark:bg-neutral-700" />
                </div>
              ) : null}
              {tags.length > 0 && (
                <ul className="flex flex-wrap gap-2 mt-3" aria-label="현재 재생곡 태그">
                  {tags.slice(0, 5).map((tag) => (
                    <li key={tag}>
                      <a
                        href={`https://soundcloud.com/search?q=${encodeURIComponent(tag)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-2 py-1 text-xs rounded-full bg-textThr text-textSub hover:text-primary hover:bg-primary/6"
                        aria-label={`SoundCloud에서 ${tag} 태그 검색 (새 창)`}
                      >
                        # {tag}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-b-textThr">
                <h4 className="font-semibold">All Playlists</h4>
                <ListMusic className="size-5.5" />
              </div>
              {soundCloudWidget.playlistStatus === 'loading' ? (
                <p
                  className="flex items-center gap-2 text-sm text-textBase"
                  role="status"
                  aria-live="polite"
                >
                  <AudioEqualizerIcon
                    isPlaying={true}
                    aria-hidden="true"
                    className="size-4 text-textBase"
                  />
                  플레이리스트 불러오는 중...
                </p>
              ) : (
                <ol className="space-y-4">
                  {soundCloudWidget.playlistStatus === 'error' ? (
                  <li>
                    <RetryErrorState
                      message={
                        soundCloudWidget.widgetError ??
                        '플레이리스트를 불러오지 못했습니다.'
                      }
                      onRetry={soundCloudWidget.retryLoad}
                    />
                  </li>
                ) : soundCloudWidget.playlistStatus === 'ready' ? (
                  tracks.map((track, index) => {
                    const isActive =
                      isPlaylistMode &&
                      String(track.id) === String(playlistTrack?.id);

                    return (
                      <li key={track.id}>
                        <button
                          type="button"
                          onClick={() => {
                            if (isActive) {
                              soundCloudWidget.toggle();
                              return;
                            }

                            onSelect(index);
                          }}
                          aria-label={`${track.title} ${isActive && isPlaying ? '일시정지' : '재생'}`}
                          className={clsx(
                            'group grid grid-cols-[3rem_1fr_30px] grid-rows-2 gap-x-2.5 items-center w-full text-left hover:text-primary',
                            isActive && 'text-primary'
                          )}
                        >
                          <span className="row-span-2 overflow-hidden flex relative size-12 rounded-lg">
                            <img
                              src={toHighResArtwork(track.artworkUrl)}
                              alt=""
                              className="size-full object-cover"
                              onError={(event) => {
                                event.currentTarget.src = noImage;
                                event.currentTarget.onerror = null;
                              }}
                            />
                            {isActive && (
                              <i className="flex justify-center items-center absolute inset-0 bg-primary/45">
                                <AudioEqualizerIcon isPlaying={isPlaying} className="text-white" />
                              </i>
                            )}
                          </span>
                          <span
                            className={clsx(
                              'col-start-2 block w-full text-sm text-textBase truncate group-hover:text-primary',
                              isActive && 'text-primary!'
                            )}
                          >
                            {track.title}
                          </span>
                          <span
                            className={clsx(
                              'col-start-2 block text-[11px] text-textSub truncate group-hover:text-primary',
                              isActive && 'text-primary!'
                            )}
                          >
                            {track.artist}
                          </span>
                          <span
                            className={clsx(
                              'col-start-3 row-span-2 row-start-1 flex justify-center font-inter text-[11px] font-light text-textSub group-hover:text-primary',
                              isActive && 'text-primary!'
                            )}
                          >
                            {formatTime(track.durationMs)}
                          </span>
                        </button>
                      </li>
                    );
                  })
                ) : (
                  <li className="text-sm text-gray-500">플레이리스트가 비어 있어요</li>
                  )}
                </ol>
              )}
            </div>
          </div>
        </div>
      </aside>
      {isModal && collapsed && (
        <div
          className="fixed inset-0 z-150 bg-black/40"
          aria-hidden="true"
          onMouseDown={onClose}
        />
      )}
    </>
  );
}
