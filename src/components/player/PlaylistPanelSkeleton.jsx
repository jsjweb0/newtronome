import {Heart, Play} from "lucide-react";

export default function PlaylistPanelSkeleton() {
    return (
        <aside className="max-xl:hidden fixed top-3 right-3 h-full xl:max-h-[calc(100%-116px-2.25rem)] z-25 w-full max-w-[300px] rounded-2xl animate-pulse">
            {/* 커버 또는 플레이리스트 헤더 자리 */}
            <div className="flex flex-col gap-3 h-full overflow-hidden">
                <div className="flex items-center gap-x-2 p-4 bg-background rounded-2xl">
                    <div
                          className="inline-flex justify-center items-center size-11 rounded-full bg-gray-200 dark:bg-neutral-700">
                    </div>
                    <div
                        className="inline-flex justify-center items-center size-11 rounded-full bg-gray-200 dark:bg-neutral-700 ">
                    </div>
                </div>

                <div className="grow flex flex-col gap-y-2 p-4 bg-background rounded-2xl">
                    <div className="flex flex-col gap-y-2">
                        <div className="w-full size-50 bg-gray-200 dark:bg-neutral-700 rounded-2xl"/>
                        <div className="mt-2 w-full h-4 bg-gray-200 dark:bg-neutral-700 rounded"></div>
                        <div className="w-1/3 h-2 bg-gray-200 dark:bg-neutral-700 rounded"></div>
                        <div className="flex items-center gap-x-2 mt-4 text-neutral-700">
                            <span className="flex items-center justify-center size-8 rounded-lg bg-gray-200 dark:bg-neutral-700">
                                <Heart className="size-4 fill-textBase stroke-none"/>
                            </span>
                            Likes <i
                            className="inline-block w-1 h-1 rounded-full bg-textSub"></i> <Play
                            className="size-3 fill-textBase stroke-none"/> Plays
                        </div>
                        <ul className="flex flex-wrap gap-2 mt-2">
                            {Array.from({length: 5}).map((_, i) => (
                                <li key={i} className="inline-block w-1/4 h-5 px-2 py-1 bg-gray-200 dark:bg-neutral-700 rounded-full"
                                    >
                                </li>
                            ))}
                        </ul>
                    </div>
                    {/* 트랙 리스트 자리 */}
                    <ul className="space-y-3 mt-5 pt-5 border-t border-t-textThr">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <li key={i} className="flex items-center gap-3">
                                {/* 썸네일 */}
                                <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-neutral-700" />
                                {/* 제목/아티스트 */}
                                <div className="flex-1 space-y-1">
                                    <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded" />
                                    <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-1/2" />
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </aside>
    );
}
