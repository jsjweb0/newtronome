import { useCallback, useEffect, useRef } from 'react';
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
import Tooltip from '../ui/Tooltip.jsx';
import LikeButton from '../ui/LikeButton.jsx';
import { useDarkMode } from '../../contexts/useDarkMode.js';

export default function PlayerBar({ onPanelToggle, collapsed, soundCloudWidget }) {
  const currentTrack = usePlayerStore(selectCurrentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);
  const isMuted = usePlayerStore((state) => state.isMuted);

  const { toggle, seek, toggleMute, rewindToStart, previousTrack, nextTrack, playRandomTrack } =
    soundCloudWidget;

  const { isDarkMode } = useDarkMode();
  const rangeRef = useRef(null);

  const min = 0;
  const max = duration || 0;
  const step = 0.01; // 0.01초 단위로 이동
  const value = currentTime;

  const handleChange = (event) => {
    const time = Number(event.target.value);
    seek(time);
  };

  // 슬라이더 배경 업데이트
  const handleInput = useCallback(
    (e) => {
      const { min, max, value } = e.target;
      const pct = ((value - min) / (max - min)) * 100;
      const darkStyle = `linear-gradient(to right, #00FFB2 0%, #00FFB2 ${pct}%, #333 ${pct}%, #333 100%)`;
      const lightStyle = `linear-gradient(to right, #fd81a0 0%, #fd81a0 ${pct}%, #ebebeb ${pct}%, #ebebeb 100%)`;
      e.target.style.background = isDarkMode ? darkStyle : lightStyle;
    },
    [isDarkMode]
  );

  useEffect(() => {
    if (rangeRef.current) handleInput({ target: rangeRef.current });
  }, [currentTime, duration, handleInput]);

  if (!currentTrack) return null;

  return (
    <div className="flex gap-x-3 xl:gap-x-20 items-center max-xl:justify-between relative w-full h-full text-textBase p-3 xl:p-4">
      {/* 좌측: 커버 + 곡 정보 */}
      <div className="xl:shrink-0 flex items-center gap-2 xl:gap-4 xl:w-[29%] min-w-0">
        <span className="shrink-0 w-11 h-11 xl:w-21 xl:h-21">
          <img
            src={currentTrack?.artworkUrl}
            alt={currentTrack?.title}
            className="rounded-xl xl:rounded-2xl object-cover"
          />
        </span>
        <div className="overflow-hidden lg:grow max-xl:mb-2">
          <div className="text-xs xl:text-base font-medium truncate">{currentTrack?.title}</div>
          <p className="text-[11px] xl:text-sm text-textSub">{currentTrack?.artist}</p>
        </div>
      </div>

      <div className="shrink-0 xl:grow inline-flex flex-col gap-y-1 items-center justify-center">
        {/* 중앙: 진행바 */}
        <div className="playerBar max-xl:absolute max-xl:left-16 max-xl:bottom-2 w-[calc(100%-196px)] xl:w-full">
          <input
            ref={rangeRef}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            onInput={handleInput}
            className="w-full h-1 xl:h-1.5 rounded appearance-none"
            style={{ background: '#ddd' }}
            aria-label={currentTrack?.title}
          />
        </div>

        {/* 컨트롤 버튼 */}
        <div className="flex gap-6 items-center mt-1.5 text-textBase text-xl">
          <Tooltip content="처음으로" className="max-xl:hidden">
            <button type="button" onClick={rewindToStart} aria-label="재생시간 처음으로">
              <RotateCcw aria-hidden="true" />
            </button>
          </Tooltip>
          <Tooltip content="Previous" className="max-xl:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center w-11 h-11 p-2.5"
              onClick={previousTrack}
              aria-label="이전 트랙"
            >
              <SkipBack aria-hidden="true" className="fill-textBase" />
            </button>
          </Tooltip>
          <Tooltip content={isPlaying ? 'Pause' : 'Play'}>
            <button
              type="button"
              onClick={toggle}
              className="inline-flex items-center justify-center w-11 h-11 bg-textBase rounded-full"
              aria-label={isPlaying ? '정지' : '재생'}
            >
              {isPlaying ? (
                <Pause aria-hidden="true" className="fill-background stroke-1 stroke-background" />
              ) : (
                <Play aria-hidden="true" className="fill-background stroke-1 stroke-background" />
              )}
            </button>
          </Tooltip>
          <Tooltip content="Next" className="max-xl:hidden">
            <button
              type="button"
              onClick={nextTrack}
              className="inline-flex items-center justify-center w-11 h-11 p-2.5"
              aria-label="다음 트랙"
            >
              <SkipForward aria-hidden="true" className="fill-textBase" />
            </button>
          </Tooltip>
          <Tooltip content="Shuffle" className="max-xl:hidden">
            <button type="button" onClick={playRandomTrack} aria-label="임의의 트랙 재생">
              <Shuffle aria-hidden="true" />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="shrink-0 flex gap-x-1.5 xl:gap-x-5 absolute right-16 xl:right-4 bottom-2.5 xl:top-1/2 2xl:static 2xl:mt-5 ">
        <Tooltip content={collapsed ? '플레이리스트 닫기' : '플레이리스트 열기'} position="top">
          <button
            type="button"
            onClick={onPanelToggle}
            aria-label={collapsed ? '플레이리스트 닫기' : '플레이리스트 열기'}
          >
            <ListMusic aria-hidden="true" className="size-4 xl:size-7" />
          </button>
        </Tooltip>
        <Tooltip content="좋아요">
          <LikeButton
            docId={String(currentTrack?.id)}
            collection="tracks"
            showCount={false}
            svgClassName="size-4 xl:size-7 text-white fill-white"
          />
        </Tooltip>
        <div className="hidden xl:flex items-center gap-x-3 w-full">
          <Tooltip content={isMuted ? '소리 켬' : '소리 끔'} position="top" className="shrink-0">
            <button type="button" onClick={toggleMute} aria-label={isMuted ? '소리 켬' : '소리 끔'}>
              {isMuted ? (
                <VolumeOff aria-hidden="true" className="size-7" />
              ) : (
                <Volume2 aria-hidden="true" className="size-7" />
              )}
            </button>
          </Tooltip>
          <div className="hidden w-24 h-1.5 bg-[#333] rounded">
            <div className="w-[80%] h-full bg-textBase rounded transition-all duration-300"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
