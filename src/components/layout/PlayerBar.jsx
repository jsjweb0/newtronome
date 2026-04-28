import {useEffect, useRef, useState} from "react";
import {useAudioPlayerContext} from "../../contexts/useAudioPlayerContext.js";
import {
    SkipBack,
    SkipForward,
    Play,
    Pause,
    ListMusic,
    Heart,
    Volume2,
    RotateCcw,
    Shuffle,
    VolumeOff
} from "lucide-react";
import Tooltip from "../ui/Tooltip.jsx";
import LikeButton from "../ui/LikeButton.jsx";
import {useDarkMode} from "../../contexts/useDarkMode.js";

export default function PlayerBar({onPanelToggle, collapsed}) {
    const {
        tracks,
        audioRef,
        currentTrack,
        isPlaying,
        toggle,
        onTimeUpdate,
        onLoadedMetadata,
        currentTime,
        setCurrentTime,
        duration,
        prev,
        next,
        mute,
        isMuted,
        rewindToStart,
        shuffle,
        setDuration,
        toggleMute
    } = useAudioPlayerContext();

    if (!tracks) return null;

    const {isDarkMode} = useDarkMode();
    const rangeRef = useRef(null);
    const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
    const progress = duration ? currentTime / duration : 0;

    const min = 0;
    const max = duration || 0;
    const step = 0.01;               // 0.01초 단위로 이동
    const value = currentTime;

    useEffect(() => {
        if (!currentTrack?.mp3Url) return;
        const audio = audioRef.current;
        audio.src = currentTrack.mp3Url;
        audio.load();
    }, [currentTrack, audioRef]);

    // (1) 사용자가 드래그할 때 오디오 위치 바꾸기
    const handleChange = e => {
        const t = parseFloat(e.target.value);
        audioRef.current.currentTime = t;
        setCurrentTime(t);
    };

    // (2) 슬라이더 배경(채워진 부분) 업데이트
    const handleInput = e => {
        const {min, max, value} = e.target;
        const pct = ((value - min) / (max - min)) * 100;
        const darkStyle = `linear-gradient(to right, #00FFB2 0%, #00FFB2 ${pct}%, #333 ${pct}%, #333 100%)`;
        const lightStyle = `linear-gradient(to right, #fd81a0 0%, #fd81a0 ${pct}%, #ebebeb ${pct}%, #ebebeb 100%)`;
        e.target.style.background = isDarkMode ? darkStyle : lightStyle;
    };

    // (3) 재생 중에도 슬라이더 백그라운드 갱신
    useEffect(() => {
        if (rangeRef.current) handleInput({ target: rangeRef.current });
    }, [isDarkMode, currentTime, duration]);

    return (
        <div
            className="flex gap-x-3 xl:gap-x-20 items-center max-xl:justify-between relative w-full h-full text-textBase p-3 xl:p-4">
            {/* 좌측: 커버 + 곡 정보 */}
            <div className="xl:shrink-0 flex items-center gap-2 xl:gap-4 xl:w-[426px] min-w-0">
                <span className="shrink-0 w-11 h-11 xl:w-21 xl:h-21">
                    <img src={currentTrack?.artwork} alt={currentTrack?.title}
                         className="rounded-xl xl:rounded-2xl object-cover"/>
                </span>
                <div className="overflow-hidden lg:grow max-xl:mb-2">
                    <div className="text-xs xl:text-base font-medium truncate">
                        {currentTrack?.title}
                    </div>
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
                        style={{background: "#ddd"}}
                        aria-label={currentTrack?.title}
                    />
                </div>
                {/*<div className="hidden xl:flex items-center w-full">
                    <div className="flex-1 flex items-center gap-x-5 w-full">
                        <span className="text-textSub text-xs xl:text-sm">{fmt(currentTime)}</span>
                        <div className="w-full h-1.5 bg-textThr rounded">
                            <div className="h-full bg-primary rounded transition-all duration-300"
                                 style={{width: `${progress * 100}%`}}
                            >
                            </div>
                        </div>
                        <span className="text-textSub text-xs xl:text-sm">{fmt(duration)}</span>
                    </div>
                </div>*/}
                {/* 컨트롤 버튼 */}
                <div className="flex gap-6 items-center mt-1.5 text-textBase text-xl">
                    <Tooltip content="처음으로" className="max-xl:hidden">
                        <button type="button" onClick={rewindToStart} aria-label="재생시간 처음으로">
                            <RotateCcw/>
                        </button>
                    </Tooltip>
                    <Tooltip content="Previous" className="max-xl:hidden">
                        <button type="button"
                                className="inline-flex items-center justify-center w-11 h-11 p-2.5"
                                onClick={prev}
                                aria-label="이전 트랙"
                        >
                            <SkipBack className="fill-textBase"/>
                        </button>
                    </Tooltip>
                    <Tooltip content={isPlaying ? "Pause" : "Play"}>
                        <button type="button" onClick={toggle}
                                className="inline-flex items-center justify-center w-11 h-11 bg-textBase rounded-full"
                                aria-label={isPlaying ? "정지" : "재생"}
                        >
                            {isPlaying ? (
                                <Pause className="fill-background stroke-1 stroke-background"/>
                            ) : (
                                <Play className="fill-background stroke-1 stroke-background"/>
                            )}
                        </button>
                    </Tooltip>
                    <Tooltip content="Next" className="max-xl:hidden">
                        <button type="button" onClick={next}
                                className="inline-flex items-center justify-center w-11 h-11 p-2.5" aria-label="다음 트랙">
                            <SkipForward className="fill-textBase"/>
                        </button>
                    </Tooltip>
                    <Tooltip content="Shuffle" className="max-xl:hidden">
                        <button type="button" onClick={shuffle} aria-label="재생목록 랜덤"><Shuffle/></button>
                    </Tooltip>
                </div>
            </div>

            <div
                className="shrink-0 flex gap-x-1.5 xl:gap-x-5 absolute right-16 xl:right-4 bottom-2.5 xl:top-1/2 2xl:static 2xl:mt-5 ">
                <Tooltip content={collapsed ? "플레이리스트 닫기" : "플레이리스트 열기"} position="top">
                    <button type="button"
                            onClick={onPanelToggle}
                            aria-label={collapsed ? "플레이리스트 닫기" : "플레이리스트 열기"}
                    ><ListMusic className="size-4 xl:size-7"/>
                    </button>
                </Tooltip>
                <Tooltip content="좋아요">
                    <LikeButton docId={String(currentTrack?.id)}
                                collection="tracks"
                                showCount={false}
                                svgClassName="size-4 xl:size-7 text-white fill-white"
                    />
                </Tooltip>
                <div className="hidden xl:flex items-center gap-x-3 w-full">
                    <Tooltip content={isMuted ? "소리 켬" : "소리 끔"} position="top" className="shrink-0">
                        <button type="button"
                                onClick={mute}
                                aria-label={isMuted ? "소리 켬" : "소리 끔"}
                        >
                            {isMuted ? (
                                <VolumeOff className="size-7"/>
                            ) : (
                                <Volume2 className="size-7"/>
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
