import {useMemo, useState} from "react";
import ImageSlider from "../components/ui/Slider.jsx";
import {useAudioPlayerContext} from "../contexts/AudioPlayerContext.jsx";
import {toHighResArtwork} from "../utils/image.js";
import {LogoIcon, GridIcon, PlayRound, PauseRound} from "../components/icons/index.js";
import {CircleX, Home, List, ListMusic, Play} from "lucide-react";
import TrackItem from "../components/track/TrackItem.jsx";
import HomePageSkeleton from "./HomePageSkeleton.jsx";

const formatDuration = (min) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
};

export default function HomePage() {
    const [searchKeyword, setSearchKeyword] = useState("");
    const [viewMode, setViewMode] = useState("grid");

    const {
        tracks,
        currentTrack,
        currentIndex,
        isPlaying,
        duration,
        totalDurationMinutes,
        select,
        handleTrackClick

    } = useAudioPlayerContext();

    const images = tracks
        .filter(track => !!track?.artwork)
        .map(track => toHighResArtwork(track.artwork));

    const filteredTracks = useMemo(() => {
        return tracks
            .slice()
            .filter(track => (track.title || '').toLowerCase().includes(searchKeyword.toLowerCase()));
    }, [tracks, searchKeyword]);

    const playListTags = [
        "Electronic",
        "Disco",
        "Nudisco",
        "House",
        "Deep House",
        "Electro Funk",
        "Synth Pop",
        "French Touch",
        "Electro Pop",
        "Synthwave"
    ];


    if (!tracks || tracks.length === 0) return <HomePageSkeleton />;


    return (
        <div className="px-3">
            <div className="flex max-lg:flex-col gap-x-10 items-center z-[0] relative py-14">
                <img src={currentTrack?.artwork}
                     className="z-[-1] absolute inset-0 w-full h-full object-cover opacity-30 blur-md scale-110"
                     alt=""/>
                <div className="shrink-0 w-80 max-w-full">
                    <div className="overflow-hidden relative pt-[100%]">
                        <ImageSlider images={images} className="!absolute top-0 left-0"/>
                    </div>
                </div>
                <div className="grow max-lg:mt-5">
                    <div className="flex items-center gap-x-2 text-textSub max-lg:text-xs max-lg:mb-2">
                        <p>총 <b>{tracks.length}</b>곡</p>
                        <i className="inline-block w-1 h-1 rounded-full bg-textSub"></i>
                        <p>{formatDuration(totalDurationMinutes)}</p>
                    </div>
                    <h2 className="font-black font-inter text-3xl lg:text-[5vw] leading-none">Now Playlist</h2>
                    <div className="flex mt-5 lg:mt-8">
                        <ul className="flex flex-wrap gap-[3px] lg:gap-2">
                            {playListTags.map(tag => (
                                <li key={tag}
                                    className="inline-block px-2 py-1 rounded-full bg-textThr text-textSub text-xs lg:text-sm font-inter">
                                    # {tag}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="z-1 relative mt-1 md:mt-16">
                <div className="flex flex-wrap items-center justify-between relative mb-5 md:mb-10 md:pr-64">
                    <h4 className="flex items-center justify-between gap-x-2 text-lg lg:text-2xl font-bold"><ListMusic
                        className="max-md:size-5"/>Track List</h4>
                    <div className="shrink-0 flex gap-x-1 items-center">
                        <p className="mr-1 text-textSub text-sm">View</p>
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`inline-flex justify-center items-center p-1 bg-background rounded-lg ${viewMode === "grid" ? "text-primary" : "text-textBase"}`}
                            aria-label="Badges"
                        >
                            <GridIcon className="size-5 md:size-6"/>
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`inline-flex justify-center items-center p-1 bg-background rounded-lg ${viewMode === "list" ? "text-primary" : "text-textBase"}`}
                            aria-label="List"
                        >
                            <List className="max-md:size-5"/>
                        </button>
                    </div>
                    <div className="relative md:absolute md:right-0 w-full md:w-60 space-y-3 max-md:mt-3">
                        <input type="text"
                               className="py-2.5 sm:py-3 px-4 block w-full mb-0 border border-textThr dark:border-none rounded-lg bg-background text-sm md:text-base disabled:opacity-50 disabled:pointer-events-none focus:ring-primary"
                               placeholder="Filter"
                               value={searchKeyword}
                               onChange={(e) => setSearchKeyword(e.target.value)}
                               aria-label="Track Search"
                        />
                        {searchKeyword && (
                            <button onClick={() => setSearchKeyword("")}
                                    className="inline-flex items-center absolute top-0 right-1 md:right-0 h-full px-2 md:px-3 text-textSub"
                                    aria-label="검색어 삭제">
                                <CircleX className="size-4 md:size-5"/>
                            </button>
                        )}
                    </div>
                </div>
                <div
                    className={viewMode === "grid" ? "grid grid-cols-3 md:grid-cols-5 gap-x-4 gap-y-8 lg:gap-y-14 mt-6" : "flex flex-col gap-2"}>
                    {filteredTracks.map((track, idx) => {

                        return (
                            <TrackItem key={`${track.id}-${idx}`}
                                       idx={idx}
                                       track={track}
                                       currentTrack={currentTrack}
                                       viewMode={viewMode}
                                       isPlaying={isPlaying}
                                       handleTrackClick={handleTrackClick}
                                       select={select}
                                       searchKeyword={searchKeyword}
                            />
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
