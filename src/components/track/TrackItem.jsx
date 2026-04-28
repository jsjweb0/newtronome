import clsx from "clsx";
import {viewModeMultiClass, viewModeClass} from "../../utils/viewModeClass.js";
import {formatTime} from "../../utils/format.js";
import {toHighResArtwork} from "../../utils/image.js";
import {PauseRound, PlayRound} from "../icons/index.js";

export default function TrackItem({
                                      idx,
                                      track,
                                      currentTrack,
                                      viewMode = "grid",
                                      isPlaying,
                                      handleTrackClick,
                                      select,
                                      isPlayingPreview,
                                      searchKeyword
                                  }) {
    const onSelect = () => {
        if (typeof select === "function") {
            select(idx);
        }
    };

    const isThisTrack = currentTrack?.id === track.id;
    const isPlayingTrack = isThisTrack && isPlaying;
    const isPaused = isThisTrack && !isPlaying;

    const statusClass = clsx(
        isThisTrack && "isThisTrack",
        (isPlayingTrack || isPlayingPreview) && "isPlaying",
        isPaused && "isPaused"
    );

    return (
        <div className={viewModeMultiClass(viewMode, {
            grid: "max-w-60",
            list: "flex items-center gap-4 max-w-none py-2"
        })}>
            <button type="button"
                    onClick={() => {
                        // 여기에 곡 선택 로직 넣을 수 있음 (ex: setCurrentTrack(track))
                        onSelect();
                        handleTrackClick(track);
                        console.log(`Play: ${track.title}`);
                    }}
                    className={clsx(
                        "group w-full",
                        viewModeMultiClass(viewMode, {
                            grid: "flex flex-1 flex-col",
                            list: "grid grid-cols-[20px_58px_auto_28px] max-md:grid-rows-2 md:grid-cols-[24px_80px_2fr_1fr_60px] gap-x-1 md:gap-x-6 items-center text-left hover:bg-textSub/10"
                        }),
                        statusClass
                    )}>
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
                    <img src={toHighResArtwork(track.artwork)} alt={track.title}
                         className={clsx(
                             "block object-cover w-full h-full transition-transform",
                             viewModeClass(viewMode, "absolute top-0 left-0"),
                             "group-hover:scale-110"
                         )}
                    />
                    <i className={clsx(
                        "hidden items-center justify-center absolute inset-0 bg-white/30 ",
                        "opacity-0 transition-all duration-300",
                        "group-hover:flex group-[.isPlaying]:flex group-[.isPaused]:flex",
                        "group-hover:opacity-100 group-[.isPlaying]:opacity-100 group-[.isPaused]:opacity-100"
                    )}
                    >
                       {isPlayingTrack || isPlayingPreview ? (
                           <PauseRound
                               className={clsx(
                                   "fade-in fill-white transition-all duration-300",
                                   viewModeClass(viewMode, "size-12 lg:size-18", "size-6 lg:size-8"),
                               )}/>
                       ) : (
                           <PlayRound
                               className={clsx(
                                   "fade-in fill-white transition-all duration-300",
                                   viewModeClass(viewMode, "size-12 lg:size-18", "size-6 lg:size-8"),
                               )}/>
                       )}
                    </i>
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
                {viewMode === "list" && (
                    <span className="row-span-2 block text-textSub text-xs lg:text-sm font-inter">{formatTime(track.duration)}</span>
                )}
            </button>
        </div>
    );
}