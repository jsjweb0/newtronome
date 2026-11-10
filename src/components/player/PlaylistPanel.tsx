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
import ExternalLink from '../ui/ExternalLink';
import type { PlayerTrack } from '../../features/player/types/player.types';
import type { useSoundCloudWidget } from '../../features/player/hooks/useSoundCloudWidget';
import TrackBookmarkButton from '../../features/bookmarks/components/TrackBookmarkButton';
import RetryErrorState from '../ui/RetryErrorState';
import { RefObject, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

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

  const isNowPlaying = Boolean(playlistTrack) && isPlaylistMode && isPlaying;

  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // 모달은 포커스가 패널 안에서만 돌아서 전역 토스트의 로그인 링크에 갈 수 없음.
  // 그래서 모달일 때는 로그인 안내를 패널 안에 보여 줌
  const [isLoginNoticeOpen, setIsLoginNoticeOpen] = useState(false);
  const loginNoticeTriggerRef = useRef<HTMLElement | null>(null);

  const openLoginNotice = () => {
    loginNoticeTriggerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setIsLoginNoticeOpen(true);
  };

  const dismissLoginNotice = () => {
    setIsLoginNoticeOpen(false);
    // 닫기 버튼이 사라지면서 포커스가 패널 밖으로 빠지지 않게 누른 버튼으로 되돌림
    (loginNoticeTriggerRef.current ?? closeButtonRef.current)?.focus();
  };

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
      setIsLoginNoticeOpen(false);
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
        data-state={collapsed ? 'open' : 'closed'}
        role={isModal ? 'dialog' : undefined}
        aria-modal={isModal ? true : undefined}
        aria-labelledby="playlist-panel-title"
        tabIndex={isModal ? -1 : undefined}
        className={clsx(
          'z-51 fixed top-0 lg:top-3 right-0 lg:right-3 h-full xl:max-h-[calc(100%-116px-2.25rem)] transform transition-transform duration-300 w-full max-w-md lg:max-w-75 rounded-2xl',
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
              'max-xl:pb-3',
              'border border-textThr dark:border-none',
              collapsed ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
            )}
          >
            <div className="flex flex-col gap-y-4.5 p-4 max-lg:pb-6">
              {isModal ? (
                <div className="flex items-center justify-between -mt-1 -mr-1">
                  <h2 id="playlist-panel-title" className="text-lg font-extrabold">
                    재생 목록
                  </h2>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={onClose}
                    aria-label="플레이리스트 닫기"
                    className="inline-flex items-center justify-center size-11 rounded-full bg-textThr hover:bg-textSub/30 transition-colors"
                  >
                    <XIcon aria-hidden="true" className="size-5" />
                  </button>
                </div>
              ) : (
                <h2 id="playlist-panel-title" className="sr-only">
                  현재 재생 중인 곡과 플레이리스트
                </h2>
              )}

              {/* 현재 곡 */}
              <div className="flex flex-col gap-y-3">
                <div className="relative overflow-hidden aspect-square rounded-[14px] shadow-[0_12px_28px_rgba(0,0,0,0.45)]">
                  <img
                    src={toHighResArtwork(playlistTrack?.artworkUrl)}
                    alt=""
                    className="size-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = noImage;
                      event.currentTarget.onerror = null;
                    }}
                  />
                  {isNowPlaying && (
                    <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/72 text-[11px] font-bold text-accent">
                      <AudioEqualizerIcon isPlaying={true} aria-hidden="true" className="size-3" />
                      재생 중
                    </span>
                  )}
                </div>

                {playlistTrack ? (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-y-0.5 min-w-0">
                        {playlistTrack.permalinkUrl ? (
                          <ExternalLink
                            href={playlistTrack.permalinkUrl}
                            label={`${playlistTrack.title} 원곡을 SoundCloud에서 열기`}
                            className="text-[17px] font-extrabold leading-snug line-clamp-2 hover:text-primary"
                          >
                            {playlistTrack.title}
                          </ExternalLink>
                        ) : (
                          <strong className="text-[17px] font-extrabold leading-snug line-clamp-2">
                            {playlistTrack.title}
                          </strong>
                        )}
                        <span className="text-[13px] text-textSub truncate">{playlistTrack.artist}</span>
                      </div>
                      {playlistTrack.permalinkUrl && (
                        <ExternalLink
                          href={playlistTrack.permalinkUrl}
                          label="SoundCloud에서 듣기"
                          title="SoundCloud에서 듣기 (새 창)"
                          className="shrink-0 inline-flex items-center justify-center w-14 h-10 rounded-[10px] hover:bg-textThr transition-colors"
                        >
                          <img src={soundCloudFaviconBlack} alt="" className="h-[22px] w-auto dark:hidden" />
                          <img src={soundCloudFaviconWhite} alt="" className="hidden h-[22px] w-auto dark:block" />
                        </ExternalLink>
                      )}
                    </div>

                    <div className="flex items-center gap-x-2.5">
                      <TrackBookmarkButton
                        track={playlistTrack}
                        onLoginRequired={isModal ? openLoginNotice : undefined}
                        className="gap-1.5 min-h-9 px-3 rounded-full border border-textThr text-xs font-bold aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-primary"
                        iconClassName="size-[15px]!"
                      >
                        Likes
                      </TrackBookmarkButton>
                      <span className="inline-flex items-center gap-1 text-xs text-textSub tabular-nums">
                        <Play aria-hidden="true" className="size-[11px] fill-current stroke-none" />
                        <span className="sr-only">재생 시간</span>
                        {formatTime(playlistTrack.durationMs)}
                      </span>
                    </div>
                  </>
                ) : soundCloudWidget.playlistStatus === 'loading' ? (
                  <div
                    className="space-y-2 animate-pulse"
                    role="status"
                    aria-label="트랙 정보 불러오는 중"
                  >
                    <div className="h-4 w-3/4 rounded bg-textThr" />
                    <div className="h-3 w-1/3 rounded bg-textThr" />
                    <div className="mt-4 h-9 w-24 rounded-full bg-textThr" />
                  </div>
                ) : null}

                {tags.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5" aria-label="현재 재생곡 태그">
                    {tags.slice(0, 5).map((tag) => (
                      <li key={tag}>
                        <ExternalLink
                          href={`https://soundcloud.com/search?q=${encodeURIComponent(tag)}`}
                          label={`SoundCloud에서 ${tag} 태그 검색`}
                          className="inline-flex items-center min-h-7 px-2.5 text-xs rounded-full bg-line text-textSub hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          # {tag}
                        </ExternalLink>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* 전체 목록 */}
              <div className="flex flex-col gap-y-2 pt-3.5 border-t border-textThr">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-baseline gap-1.5 text-[15px] font-extrabold">
                    All Playlists
                    {soundCloudWidget.playlistStatus === 'ready' && tracks.length > 0 && (
                      <span className="text-xs font-medium text-textSub">{tracks.length}곡</span>
                    )}
                  </h3>
                  <ListMusic aria-hidden="true" className="size-[18px] text-textSub" />
                </div>
                {soundCloudWidget.playlistStatus === 'loading' ? (
                  <p
                    className="flex items-center gap-2 py-2 text-sm text-textBase"
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
                  <ol className="-mx-1.5">
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
                    ) : soundCloudWidget.playlistStatus === 'ready' && tracks.length > 0 ? (
                      tracks.map((track, index) => {
                        const isActive =
                          isPlaylistMode &&
                          String(track.id) === String(playlistTrack?.id);
                        const isBlocked = track.playbackStatus === 'blocked';
                        const isPreview = track.playbackStatus === 'preview';

                        return (
                          <li
                            key={track.id}
                            className={clsx(
                              'grid grid-cols-[minmax(0,1fr)_auto_2.25rem] items-center gap-1 rounded-[10px]',
                              isActive && 'bg-primary/8',
                              !isActive && !isBlocked && 'hover:bg-textSub/10',
                              isBlocked && 'opacity-45',
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                if (isActive) {
                                  soundCloudWidget.toggle();
                                  return;
                                }

                                onSelect(index);
                              }}
                              disabled={isBlocked}
                              aria-current={isActive ? 'true' : undefined}
                              className="grid grid-cols-[18px_40px_minmax(0,1fr)] items-center gap-2.5 min-w-0 min-h-14 pl-2 text-left disabled:cursor-not-allowed"
                            >
                              <span className="flex justify-center font-inter text-[11px] text-textSub tabular-nums">
                                {isActive ? (
                                  <AudioEqualizerIcon
                                    isPlaying={isPlaying}
                                    aria-hidden="true"
                                    className="size-3.5 text-primary"
                                  />
                                ) : (
                                  index + 1
                                )}
                              </span>
                              <span className="overflow-hidden block size-10 rounded-lg">
                                <img
                                  src={toHighResArtwork(track.artworkUrl)}
                                  alt=""
                                  className="size-full object-cover"
                                  onError={(event) => {
                                    event.currentTarget.src = noImage;
                                    event.currentTarget.onerror = null;
                                  }}
                                />
                              </span>
                              <span className="flex flex-col gap-y-0.5 min-w-0">
                                <span className="flex items-center gap-1.5 min-w-0">
                                  <span className={clsx('min-w-0 text-[13px] font-bold truncate', isActive && 'text-primary')}>
                                    {track.title}
                                  </span>
                                  {isPreview && (
                                    <i className="shrink-0 px-1.5 py-px rounded-full border border-primary/55 text-primary text-[10px] font-bold not-italic">
                                      미리듣기
                                    </i>
                                  )}
                                  {isBlocked && (
                                    <i className="shrink-0 px-1.5 py-px rounded-full bg-textThr text-textSub text-[10px] font-bold not-italic">
                                      재생불가
                                    </i>
                                  )}
                                </span>
                                {' '}
                                <span className={clsx('text-[11px] truncate', isActive ? 'text-primary' : 'text-textSub')}>
                                  {track.artist}
                                </span>
                              </span>
                              {' '}
                              <span className="sr-only">
                                {isActive && isPlaying ? '일시정지' : '재생'}
                              </span>
                            </button>
                            <span className={clsx('text-[11px] tabular-nums', isActive ? 'text-primary' : 'text-textSub')}>
                              {formatTime(track.durationMs)}
                            </span>
                            {isBlocked ? (
                              <span aria-hidden="true" />
                            ) : (
                              <TrackBookmarkButton
                                track={track}
                                onLoginRequired={isModal ? openLoginNotice : undefined}
                                className="w-9 h-11 rounded-[10px] text-textSub hover:bg-textThr hover:text-textBase transition-colors"
                                iconClassName="size-4!"
                              />
                            )}
                          </li>
                        );
                      })
                    ) : (
                      <li className="py-2 text-sm text-textSub">플레이리스트가 비어 있어요</li>
                    )}
                  </ol>
                )}
              </div>
            </div>
          </div>
        </div>
        {isModal && (
          // 안내가 생기기 전부터 있어야 스크린 리더가 바뀐 내용을 읽어 줌
          <div role="status" aria-live="polite" className="absolute inset-x-3 bottom-3 z-10">
            {collapsed && isLoginNoticeOpen && (
              <div
                className={clsx(
                  'flex items-center gap-3 min-h-14 py-2.5 pr-2 pl-4 rounded-2xl text-[#2B6CB0] dark:text-[#7CC4FF]',
                  'bg-background/92 dark:bg-background/88 backdrop-blur-[18px] backdrop-saturate-140',
                  'border border-black/8 dark:border-white/8',
                  'shadow-[0_12px_32px_rgba(0,0,0,0.14)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.5)]'
                )}
              >
                <p className="grow min-w-0 text-sm font-medium leading-[1.45] text-textBase break-keep">
                  로그인 후 북마크할 수 있습니다.
                </p>
                <Link
                  to="/login"
                  onClick={onClose}
                  className="shrink-0 inline-flex items-center min-h-9 px-3 rounded-full bg-current/16 text-[13px] font-bold hover:bg-current/24 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                >
                  로그인
                </Link>
                <button
                  type="button"
                  aria-label="안내 닫기"
                  onClick={dismissLoginNotice}
                  className="shrink-0 inline-flex items-center justify-center size-8 rounded-full text-textSub hover:text-textBase hover:bg-black/6 dark:hover:bg-white/8 focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <XIcon aria-hidden="true" className="size-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </aside>
      {isModal && collapsed && (
        <div
          className="fixed inset-0 z-1 bg-black/40"
          aria-hidden="true"
          onMouseDown={onClose}
        />
      )}
    </>
  );
}
