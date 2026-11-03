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
    footerActions,
    ariaLabel,
}: TrackItemProps) {
    const isBlocked = track.playbackStatus === 'blocked';

    let playbackLabel = '';

    if (isBlocked) {
        playbackLabel = '재생 불가';
    } else if (track.playbackStatus === 'preview') {
        playbackLabel = '미리듣기';
    }

    const isThisTrack = currentTrack != null && String(currentTrack.id) === String(track.id);

    const isPlayingTrack = isThisTrack && isPlaying;
    const isPaused = isThisTrack && !isPlaying;

    const statusClass = clsx(
        isThisTrack && "isThisTrack",
        (isPlayingTrack || isPlayingPreview) && "isPlaying",
        isPaused && "isPaused"
    );

    const contentClassName = clsx(
        interactive && "group",
        "w-full",
        viewModeMultiClass(viewMode, {
            grid: "flex flex-1 flex-col",
            list: clsx(
                "grid grid-cols-[2em_58px_minmax(0,1fr)_3em] max-md:grid-rows-2",
                "md:grid-cols-[2.5em_80px_2fr_1fr_5em] gap-x-1 md:gap-x-6 items-center py-2 text-left",
                interactive && "hover:bg-textSub/10"
            )
        }),
        interactive && statusClass,
    );

    const trackContent = (
        <>
            {viewMode === "list" && (
                <span className={clsx(
                    'min-w-max block text-textSub text-[11px] lg:text-sm font-inter row-span-2 text-center',
                    isBlocked && 'opacity-50',
                )}>
                    {idx + 1}
                </span>
            )}
            <span className={clsx(
                "overflow-hidden block relative rounded-lg",
                viewModeMultiClass(viewMode, {
                    grid: "pt-[100%]",
                    list: "row-span-2 size-12 md:size-20"
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
                {(interactive && !isBlocked) && (
                    <i className={clsx(
                        "hidden items-center justify-center absolute inset-0 bg-white/30 ",
                        "opacity-0 transition-all duration-300",
                        "group-hover:flex group-[.isPlaying]:flex group-[.isPaused]:flex",
                        "group-hover:opacity-100 group-[.isPlaying]:opacity-100 group-[.isPaused]:opacity-100",
                        "group-focus-visible:flex group-focus-visible:opacity-100",
                    )}
                    >
                        {isPlayingTrack || isPlayingPreview ? (
                            <PauseRound
                                className={clsx(
                                    "fade-in fill-white transition-all duration-300",
                                    viewModeClass(viewMode, "size-12 lg:size-18", "size-6 lg:size-8"),
                                )}
                                aria-hidden="true"
                            />
                        ) : (
                            <PlayRound
                                className={clsx(
                                    "fade-in fill-white transition-all duration-300",
                                    viewModeClass(viewMode, "size-12 lg:size-18", "size-6 lg:size-8"),
                                )}
                                aria-hidden="true"
                            />
                        )}
                    </i>
                )}
            </span>
            <span className={clsx(
                "block max-lg:text-sm",
                viewModeMultiClass(viewMode, {
                    grid: "mt-3",
                    list: "md:col-start-3 md:row-span-2 text-left truncate"
                }),
            )}>
                {playbackLabel && (
                    <i
                        className={clsx(
                            'mb-1 rounded px-1.5 py-0.5 text-[11px] font-medium not-italic',
                            isBlocked
                                ? 'bg-textThr text-textBase'
                                : 'bg-primary/10 text-primary',
                            viewModeMultiClass(viewMode, {
                                grid: "inline-block",
                                list: "hidden"
                            }),
                        )}
                    >
                        {playbackLabel}
                    </i>
                )}
                <span
                    className={clsx(
                        'block truncate',
                        'group-[.isThisTrack]:text-primary',
                        isBlocked && 'opacity-50',
                    )}
                >
                    {track.title}
                </span>
            </span>
            <span
                className={clsx(
                    "block text-textSub text-xs lg:text-sm",
                    "group-[.isThisTrack]:text-primary",
                    viewModeClass(viewMode, "mt-1", "max-md:col-start-3 max-md:row-start-2 md:row-span-2"),
                    isBlocked && 'opacity-50',
                )}>
                {track.artist}
            </span>
            {(viewMode === "list" || showDuration) && (
                <span className={clsx(
                    "block text-textSub text-xs lg:text-sm font-inter text-center",
                    viewModeClass(viewMode, "mt-1", "min-w-max row-span-2"),
                    isBlocked && 'opacity-50',
                )}>
                    {viewMode === 'list' && playbackLabel ? (
                        <i className={clsx(
                            'inline-block rounded px-1.5 py-0.5 text-[11px] font-medium not-italic',
                            isBlocked ? 'bg-textThr text-textBase' : 'bg-primary/10 text-primary',
                        )}>
                            {playbackLabel}
                        </i>
                    ) : (
                        formatTime(track.durationMs)
                    )}
                </span>
            )}
        </>
    );

    return (
        <div className={viewModeMultiClass(viewMode, {
            grid: "max-w-60",
            list: "flex items-center gap-4 max-w-none border-b border-b-textThr/50"
        })}>
            {interactive ? (
                <button
                    type="button"
                    onClick={() => {
                        onTrackClick?.(track);
                    }}
                    className={contentClassName}
                    disabled={isBlocked}
                    aria-label={[
                        ariaLabel ??
                        `${track.title} ${isPlayingTrack || isPlayingPreview ? '일시정지' : '재생'}`,
                        playbackLabel,
                    ].filter(Boolean).join(', ')}
                >
                    {trackContent}
                </button>
            ) : (
                <article className={contentClassName}>
                    {trackContent}
                </article>
            )}
            {footerActions && (
                <div className="mt-3">
                    {footerActions}
                </div>
            )}
        </div>
    );
}
