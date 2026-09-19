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
    const isThisTrack = currentTrack?.id === track.id;
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
                "grid grid-cols-[20px_58px_auto_28px] max-md:grid-rows-2",
                "md:grid-cols-[24px_80px_2fr_1fr_60px] gap-x-1 md:gap-x-6 items-center text-left",
                interactive && "hover:bg-textSub/10"
            )
        }),
        interactive && statusClass
    );

    const trackContent = (
        <>
            {viewMode === "list" && (
                <span className="block text-textSub text-xs lg:text-sm font-inter row-span-2">{idx + 1}</span>
            )}
            <span className={clsx(
                "overflow-hidden block relative rounded-lg",
                viewModeMultiClass(viewMode, {
                    grid: "pt-[100%]",
                    list: "row-span-2 size-12 md:size-20"
                })
            )}>
                <img src={toHighResArtwork(track.artworkUrl)} alt={track.title}
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
                {interactive && (
                    <i className={clsx(
                        "hidden items-center justify-center absolute inset-0 bg-white/30 ",
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
                                    viewModeClass(viewMode, "size-12 lg:size-18", "size-6 lg:size-8"),
                                )} />
                        ) : (
                            <PlayRound
                                className={clsx(
                                    "fade-in fill-white transition-all duration-300",
                                    viewModeClass(viewMode, "size-12 lg:size-18", "size-6 lg:size-8"),
                                )} />
                        )}
                    </i>
                )}
            </span>
            <span className={clsx(
                "block max-lg:text-sm",
                "group-[.isThisTrack]:text-primary",
                viewModeMultiClass(viewMode, {
                    grid: "mt-3",
                    list: "md:col-start-3 md:row-span-2 text-left truncate"
                }),
            )}>
                {track.title}
            </span>
            <span
                className={clsx(
                    "block text-textSub text-xs lg:text-sm",
                    "group-[.isThisTrack]:text-primary",
                    viewModeClass(viewMode, "mt-1", "max-md:col-start-3 max-md:row-start-2 md:row-span-2")
                )}>
                {track.artist}
            </span>
            {(viewMode === "list" || showDuration) && (
                <span className={clsx(
                    "block text-textSub text-xs lg:text-sm font-inter",
                    viewModeClass(viewMode, "mt-1", "row-span-2")
                )}>
                    {formatTime(track.durationMs)}
                </span>
            )}
        </>
    );

    return (
        <div className={viewModeMultiClass(viewMode, {
            grid: "max-w-60",
            list: "flex items-center gap-4 max-w-none py-2"
        })}>
            {interactive ? (
                <button
                    type="button"
                    onClick={() => {
                        onTrackClick?.(track);
                    }}
                    aria-label={ariaLabel}
                    className={contentClassName}
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
