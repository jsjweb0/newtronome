import type { ReactNode } from 'react';
import type { PlayerTrack } from '../../features/player/types/player.types';
import {
    viewModeClass,
    viewModeMultiClass,
    type ViewMode,
} from '../../utils/viewModeClass';
import { formatTime } from "../../utils/format";
import { toHighResArtwork } from "../../utils/image";
import { PauseRound, PlayRound } from '../icons';
import noImage from "../../assets/no-image.png";
import clsx from "clsx";

type TrackItemProps = {
    idx: number;
    track: PlayerTrack;
    currentTrack?: PlayerTrack | null;
    viewMode?: ViewMode;
    isPlaying?: boolean;
    onTrackClick?: (track: PlayerTrack) => void;
    isPlayingPreview?: boolean;
    interactive?: boolean;
    showDuration?: boolean;
    /** 카드/행 안에 붙는 버튼 묶음 (좋아요 · SoundCloud 등). 리스트형은 오른쪽 끝, 그리드형은 재생시간 옆 */
    actions?: ReactNode;
    footerActions?: ReactNode;
    ariaLabel?: string;
};

export default function TrackItem({
    idx,
    track,
    currentTrack,
    viewMode = "grid",
    isPlaying = false,
    onTrackClick,
    isPlayingPreview = false,
    interactive = true,
    showDuration = false,
    actions,
    footerActions,
    ariaLabel,
}: TrackItemProps) {
    const isList = viewMode === "list";
    const isBlocked = track.playbackStatus === 'blocked';

    let playbackLabel = '';

    if (isBlocked) {
        playbackLabel = '재생 불가';
    } else if (track.playbackStatus === 'preview') {
        playbackLabel = '미리듣기';
    }

    // 재생 상태 배지 (미리듣기 / 재생 불가)
    const playbackBadge = playbackLabel ? (
        <i
            className={clsx(
                'shrink-0 inline-block rounded-full px-1.5 py-0.5 text-[11px] font-bold not-italic leading-tight whitespace-nowrap',
                isBlocked
                    ? 'bg-textThr text-textBase'
                    : 'border border-primary/50 text-primary',
            )}
        >
            {playbackLabel}
        </i>
    ) : null;

    const isThisTrack = currentTrack != null && String(currentTrack.id) === String(track.id);
    const isPlayingTrack = isThisTrack && isPlaying;
    const isPaused = isThisTrack && !isPlaying;

    const statusClass = clsx(
        isThisTrack && "isThisTrack",
        (isPlayingTrack || isPlayingPreview) && "isPlaying",
        isPaused && "isPaused"
    );

    // 재생 버튼이 감싸는 영역: 리스트형은 커버 + 제목, 그리드형은 커버 + 제목 + 아티스트
    const contentClassName = clsx(
        interactive && "group",
        "w-full min-w-0",
        viewModeMultiClass(viewMode, {
            grid: clsx("flex flex-1 flex-col", actions && "text-left"),
            list: "col-span-2 grid grid-cols-subgrid items-center text-left",
        }),
        interactive && statusClass
    );

    const duration = (
        <span className={clsx(
            "block shrink-0 text-textSub text-xs font-inter tabular-nums",
            isList && "md:text-[13px] text-right",
            isBlocked && "opacity-50",
        )}>
            {formatTime(track.durationMs)}
        </span>
    );

    const trackContent = (
        <>
            <span className={clsx(
                "overflow-hidden block relative",
                viewModeMultiClass(viewMode, {
                    grid: "pt-[100%] rounded-xl",
                    list: "size-10 md:size-12 rounded-lg"
                }),
                isBlocked && 'opacity-50',
            )}>
                <img src={toHighResArtwork(track.artworkUrl)}
                    alt=""
                    className={clsx(
                        "block object-cover w-full h-full transition-transform",
                        viewModeClass(viewMode, "absolute top-0 left-0"),
                        interactive && "group-hover:scale-110 group-focus-visible:scale-110"
                    )}
                    onError={(event) => {
                        event.currentTarget.src = noImage;
                        event.currentTarget.onerror = null;
                    }}
                />
                {!isList && playbackBadge && (
                    <span className="absolute top-2 left-2 z-1 flex rounded-full bg-black/72">
                        {playbackBadge}
                    </span>
                )}
                {(interactive && !isBlocked) && (
                    <i className={clsx(
                        "hidden items-center justify-center absolute inset-0",
                        viewModeClass(viewMode, "bg-black/40", "bg-black/55"),
                        "opacity-0 transition-all duration-300",
                        "group-hover:flex group-[.isPlaying]:flex group-[.isPaused]:flex",
                        "group-hover:opacity-100 group-[.isPlaying]:opacity-100 group-[.isPaused]:opacity-100",
                        "group-focus-visible:flex group-focus-visible:opacity-100"
                    )}
                    >
                        {isPlayingTrack || isPlayingPreview ? (
                            <PauseRound
                                className={clsx(
                                    "fade-in fill-white transition-all duration-300",
                                    viewModeClass(viewMode, "size-12 lg:size-18", "size-6"),
                                )}
                                aria-hidden="true"
                            />
                        ) : (
                            <PlayRound
                                className={clsx(
                                    "fade-in fill-white transition-all duration-300",
                                    viewModeClass(viewMode, "size-12 lg:size-18", "size-6"),
                                )}
                                aria-hidden="true"
                            />
                        )}
                    </i>
                )}
            </span>
            {' '}
            <span className={clsx("block min-w-0", !isList && "mt-2.5", isBlocked && "opacity-50")}>
                <span className="flex items-center gap-1.5 min-w-0">
                    <span className={clsx(
                        "block min-w-0 text-sm md:text-[15px] font-bold",
                        "group-[.isThisTrack]:text-primary",
                        (isList || actions) && "truncate"
                    )}>
                        {track.title}
                    </span>
                    {isList && playbackBadge}
                </span>
                {' '}
                <span
                    className={clsx(
                        "block mt-0.5 text-textSub text-xs md:text-[13px]",
                        "group-[.isThisTrack]:text-primary",
                        (isList || actions) && "truncate"
                    )}>
                    {track.artist}
                </span>
            </span>
            {!isList && showDuration && !actions && (
                <span className="block mt-1">{duration}</span>
            )}
        </>
    );

    const trackButton = interactive ? (
        <button
            type="button"
            onClick={() => {
                onTrackClick?.(track);
            }}
            className={contentClassName}
            disabled={isBlocked}
        >
            {trackContent}
            {' '}
            <span className="sr-only">
                {ariaLabel ?? (isPlayingTrack || isPlayingPreview ? '일시정지' : '재생')}
            </span>
        </button>
    ) : (
        <article className={contentClassName}>
            {trackContent}
        </article>
    );

    if (isList) {
        return (
            <div className={clsx(
                "grid items-center min-h-15 md:min-h-17 px-1 md:px-3 rounded-[10px]",
                "grid-cols-[20px_40px_minmax(0,1fr)_34px_auto] gap-x-2",
                "md:grid-cols-[44px_48px_minmax(0,1fr)_72px_auto] md:gap-x-3",
                interactive && !isBlocked && "hover:bg-textSub/10"
            )}>
                <span className={clsx(
                    "block text-center text-textSub text-xs md:text-sm font-inter tabular-nums",
                    isBlocked && "opacity-50",
                )}>
                    {idx + 1}
                </span>
                {trackButton}
                {duration}
                <div className="flex items-center justify-end">{actions}</div>
                {footerActions && (
                    <div className="col-span-full pb-2">{footerActions}</div>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-60">
            {trackButton}
            {actions && (
                <div className="flex items-center justify-between gap-x-1 mt-1">
                    {duration}
                    <div className="flex items-center">{actions}</div>
                </div>
            )}
            {footerActions && (
                <div className="mt-3">
                    {footerActions}
                </div>
            )}
        </div>
    );
}
