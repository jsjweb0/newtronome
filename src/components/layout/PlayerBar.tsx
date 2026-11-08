import { RefObject, useCallback, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import { selectCurrentTrack, usePlayerStore } from '../../features/player/stores/usePlayerStore';
import {
  SkipBack,
  SkipForward,
  Play,
  Pause,
  ListMusic,
  Volume2,
  RotateCcw,
  Shuffle,
  VolumeOff,
} from 'lucide-react';
import Tooltip from '../ui/Tooltip';
import { useDarkMode } from '../../contexts/DarkModeContext';
import type { useSoundCloudWidget } from '../../features/player/hooks/useSoundCloudWidget';
import TrackBookmarkButton from '../../features/bookmarks/components/TrackBookmarkButton';
import { formatTime } from '../../utils/format';
import clsx from 'clsx';

interface PlayerBarProps {
  onPanelToggle: () => void;
  collapsed: boolean;
  soundCloudWidget: ReturnType<typeof useSoundCloudWidget>;
  panelToggleRef: RefObject<HTMLButtonElement | null>;
}

export default function PlayerBar({
  onPanelToggle,
  collapsed,
  soundCloudWidget,
  panelToggleRef,
}: PlayerBarProps) {
  const playbackMode = usePlayerStore((state) => state.playbackMode);
  const isSingleMode = playbackMode === 'single';

  const currentTrack = usePlayerStore(selectCurrentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);
  const isMuted = usePlayerStore((state) => state.isMuted);

  const { toggle, seek, toggleMute, rewindToStart, previousTrack, nextTrack, playRandomTrack } =
    soundCloudWidget;
  const controlsDisabled = Boolean(soundCloudWidget.widgetError);

  const { isDarkMode } = useDarkMode();
  const rangeRef = useRef<HTMLInputElement>(null);

  const min = 0;
  const max = duration || 0;
  const step = 1;
  const value = currentTime;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const time = Number(event.currentTarget.value);
    seek(time);
  };

  // 슬라이더 배경 업데이트
  const updateRangeBackground = useCallback(
    (range: HTMLInputElement) => {
      const minValue = Number(range.min);
      const maxValue = Number(range.max);
      const currentValue = Number(range.value);
      const rangeSize = maxValue - minValue;
      const pct = rangeSize > 0 ? ((currentValue - minValue) / rangeSize) * 100 : 0;
      const darkStyle = `linear-gradient(to right, #00FFB2 0%, #00FFB2 ${pct}%, #333 ${pct}%, #333 100%)`;
      const lightStyle = `linear-gradient(to right, #fd81a0 0%, #fd81a0 ${pct}%, #ebebeb ${pct}%, #ebebeb 100%)`;
      range.style.background = isDarkMode ? darkStyle : lightStyle;
    },
    [isDarkMode]
  );

  const handleInput = (event: FormEvent<HTMLInputElement>) => {
    updateRangeBackground(event.currentTarget);
  };

  useEffect(() => {
    if (rangeRef.current) updateRangeBackground(rangeRef.current);
  }, [currentTime, duration, updateRangeBackground]);

  const playbackError = soundCloudWidget.widgetError && (
    <div className="text-xs">
      <p role="alert">{soundCloudWidget.widgetError}</p>
      <button
        type="button"
        onClick={soundCloudWidget.retryLoad}
        className="mt-1 rounded px-2 py-1 underline focus-visible:outline-2 focus-visible:outline-primary"
      >
        다시 시도
      </button>
    </div>
  );

  if (!currentTrack) return playbackError ? <div className="p-3">{playbackError}</div> : null;

  return (
    <div
      className={clsx(
        'grid items-center content-center gap-x-2 gap-y-0.5 w-full h-full text-textBase py-2.5 pl-3 pr-2.5 xl:gap-y-1.5 xl:px-6 xl:py-3',
        // 모바일: 커버 | 곡 정보 + 진행바 | 북마크·패널 | 재생
        "grid-cols-[auto_minmax(0,1fr)_auto_auto] [grid-template-areas:'cover_meta_actions_controls'_'cover_progress_actions_controls']",
        // 데스크톱: 커버 + 곡 정보 | 컨트롤 + 진행바 | 패널·북마크·볼륨
        "xl:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)] xl:gap-x-4 xl:[grid-template-areas:'cover_meta_controls_actions'_'cover_meta_progress_actions']"
      )}
    >
      {/* 커버 */}
      <span className="[grid-area:cover] shrink-0 size-12 xl:size-14 overflow-hidden rounded-lg">
        <img
          src={currentTrack.artworkUrl ?? undefined}
          alt={currentTrack.title}
          className="size-full object-cover"
        />
      </span>

      {/* 곡 정보 */}
      <div className="[grid-area:meta] min-w-0 self-end xl:self-center">
        <div className="text-sm xl:text-[15px] font-bold truncate">{currentTrack.title}</div>
        <p className="text-xs xl:text-[13px] text-textSub truncate">{currentTrack.artist}</p>
        {playbackError}
      </div>

      {/* 진행바 */}
      <div className="[grid-area:progress] self-start xl:self-center flex items-center gap-x-2.5 min-w-0">
        <span className="hidden xl:inline shrink-0 w-9 text-right text-[11px] text-textSub tabular-nums">
          {formatTime(currentTime * 1000)}
        </span>
        <div className="playerBar grow min-w-0">
          <input
            ref={rangeRef}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            onInput={handleInput}
            className="block w-full h-1 rounded appearance-none"
            style={{ background: '#ddd' }}
            aria-label={`재생 위치: ${currentTrack.title}`}
            aria-valuetext={`현재 ${formatTime(currentTime * 1000)} / 전체 ${formatTime(duration * 1000)}`}
            disabled={controlsDisabled}
          />
        </div>
        <span className="hidden xl:inline shrink-0 w-9 text-[11px] text-textSub tabular-nums">
          {formatTime(duration * 1000)}
        </span>
      </div>

      {/* 컨트롤 버튼 (모바일은 재생 버튼만) */}
      <div className="[grid-area:controls] self-center xl:self-end flex gap-x-2 xl:gap-x-3 items-center justify-center text-textBase text-xl">
        <Tooltip content="처음으로" className="max-xl:hidden">
          <button
            type="button"
            onClick={rewindToStart}
            className="inline-flex items-center justify-center size-11 p-2.5 text-textSub hover:text-textBase"
            aria-label="재생시간 처음으로"
            disabled={controlsDisabled}
          >
            <RotateCcw aria-hidden="true" className="size-5" />
          </button>
        </Tooltip>
        <Tooltip
          content={isSingleMode ? '단일 곡 재생 중' : 'Previous'}
          className="max-xl:hidden"
        >
          <button
            type="button"
            disabled={isSingleMode || controlsDisabled}
            onClick={previousTrack}
            className="inline-flex items-center justify-center size-11 p-2.5 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label={
              isSingleMode
                ? '단일 곡 재생 중에는 이전 트랙을 사용할 수 없습니다'
                : '이전 트랙'
            }
          >
            <SkipBack aria-hidden="true" className="size-5 fill-textBase" />
          </button>
        </Tooltip>
        <Tooltip content={isPlaying ? 'Pause' : 'Play'}>
          <button
            type="button"
            onClick={toggle}
            className="inline-flex items-center justify-center size-12 bg-textBase rounded-full"
            aria-label={isPlaying ? '정지' : '재생'}
            disabled={controlsDisabled}
          >
            {isPlaying ? (
              <Pause aria-hidden="true" className="size-[22px] fill-background stroke-1 stroke-background" />
            ) : (
              <Play aria-hidden="true" className="size-[22px] fill-background stroke-1 stroke-background" />
            )}
          </button>
        </Tooltip>
        <Tooltip
          content={isSingleMode ? '단일 곡 재생 중' : 'Next'}
          className="max-xl:hidden"
        >
          <button
            type="button"
            disabled={isSingleMode || controlsDisabled}
            onClick={nextTrack}
            className="inline-flex items-center justify-center size-11 p-2.5 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label={
              isSingleMode
                ? '단일 곡 재생 중에는 다음 트랙을 사용할 수 없습니다'
                : '다음 트랙'
            }
          >
            <SkipForward aria-hidden="true" className="size-5 fill-textBase" />
          </button>
        </Tooltip>
        <Tooltip content="Shuffle" className="max-xl:hidden">
          <button
            type="button"
            disabled={isSingleMode || controlsDisabled}
            onClick={playRandomTrack}
            aria-label={
              isSingleMode
                ? '단일 곡 재생 중에는 임의 재생을 사용할 수 없습니다'
                : '임의의 트랙 재생'
            }
            className="inline-flex items-center justify-center size-11 p-2.5 text-textSub hover:text-textBase disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Shuffle aria-hidden="true" className="size-5" />
          </button>
        </Tooltip>
      </div>

      {/* 우측: 플레이리스트 패널 토글 · 북마크 · 볼륨 */}
      <div className="[grid-area:actions] justify-self-end flex items-center gap-x-0.5 xl:gap-x-2">
        <Tooltip content="북마크" className="xl:order-2">
          <TrackBookmarkButton
            track={currentTrack}
            className="inline-flex items-center justify-center size-11 p-2.5"
          />
        </Tooltip>
        <Tooltip
          content={collapsed ? '플레이리스트 닫기' : '플레이리스트 열기'}
          position="top"
          className="xl:order-1"
        >
          <button
            ref={panelToggleRef}
            type="button"
            id="playlist-panel-btn"
            onClick={onPanelToggle}
            aria-controls="playlist-panel"
            aria-expanded={collapsed}
            aria-label={collapsed ? '플레이리스트 닫기' : '플레이리스트 열기'}
            className={clsx(
              'inline-flex items-center justify-center size-11 p-2.5 rounded-full transition-colors',
              collapsed ? 'text-primary' : 'text-textBase hover:text-primary'
            )}
          >
            <ListMusic aria-hidden="true" className="size-5 xl:size-6" />
          </button>
        </Tooltip>
        <Tooltip
          content={isMuted ? '소리 켬' : '소리 끔'}
          position="top"
          className="max-xl:hidden xl:order-3"
        >
          <button
            type="button"
            onClick={toggleMute}
            className="inline-flex items-center justify-center size-11 p-2.5"
            aria-label={isMuted ? '소리 켬' : '소리 끔'}
            disabled={controlsDisabled}
          >
            {isMuted || controlsDisabled ? (
              <VolumeOff aria-hidden="true" className="size-6" />
            ) : (
              <Volume2 aria-hidden="true" className="size-6" />
            )}
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
