import TrackItemSkeleton from '../components/track/TrackItemSkeleton';

const bone = 'bg-gray-200 dark:bg-neutral-700';

/** 플레이리스트 상단(PlaylistHero) + Track List(PlaylistTrackList)와 같은 배치의 로딩 화면 */
export default function HomePageSkeleton() {
    return (
        <div className="md:px-3 animate-pulse" aria-hidden="true">
            <div className="flex max-lg:flex-col items-center gap-7 lg:gap-12 px-5 py-6 lg:px-11 lg:-mt-10 lg:pt-[50px] lg:pb-10">
                {/* 커버 슬라이더: 가운데 카드 + 양옆 작은 카드 (모바일은 가운데 카드만) */}
                <div className="shrink-0 w-full max-w-[620px] lg:w-[56%]">
                    <div className="flex items-center justify-center gap-3.5">
                        <div className={`max-lg:hidden w-[24%] aspect-square rounded-[14px] opacity-50 ${bone}`} />
                        <div className={`w-full lg:w-[45%] aspect-square rounded-[14px] ${bone}`} />
                        <div className={`max-lg:hidden w-[24%] aspect-square rounded-[14px] opacity-50 ${bone}`} />
                    </div>
                    <div className="flex flex-col items-center gap-2 mt-7.5 lg:mt-[54px]">
                        <div className={`w-1/2 h-4 rounded ${bone}`} />
                        <div className={`w-1/4 h-3 rounded ${bone}`} />
                    </div>
                    <div className="flex items-center justify-center gap-x-3.5 mt-5">
                        <div className={`size-11 rounded-full ${bone}`} />
                        <div className={`w-12 h-3 rounded ${bone}`} />
                        <div className={`w-24 sm:w-32 h-1 rounded-full ${bone}`} />
                    </div>
                </div>

                {/* PLAYLIST 배지 · 제목 · 곡 수/재생시간 · Music provided by */}
                <div className="grow flex flex-col items-start gap-y-5 min-w-0 max-lg:w-full">
                    <div className={`w-[82px] h-[25px] rounded-full ${bone}`} />
                    <div className="flex flex-col gap-2.5 w-full">
                        <div className={`w-3/4 h-10 lg:h-16 rounded-lg ${bone}`} />
                        <div className={`w-1/2 h-10 lg:h-16 rounded-lg ${bone}`} />
                    </div>
                    <div className="flex gap-x-5">
                        <div className={`w-20 h-4 rounded ${bone}`} />
                        <div className={`w-16 h-4 rounded ${bone}`} />
                    </div>
                    <div className={`w-44 h-4 rounded ${bone}`} />
                </div>
            </div>

            {/* Track List 머리줄 + 그리드 */}
            <div className="relative mt-1 md:mt-9">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5 md:mb-8">
                    <div className="flex items-center gap-x-2.5">
                        <div className={`size-5 md:size-[22px] rounded ${bone}`} />
                        <div className={`w-28 h-6 rounded ${bone}`} />
                        <div className={`w-8 h-3 rounded ${bone}`} />
                    </div>
                    <div className="flex items-center gap-x-2.5 max-md:w-full">
                        <div className={`grow md:grow-0 md:w-50 h-11 rounded-[10px] ${bone}`} />
                        <div className={`shrink-0 size-11 rounded-[10px] ${bone}`} />
                        <div className={`shrink-0 size-11 rounded-[10px] ${bone}`} />
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(176px,1fr))] gap-x-3 md:gap-x-5 gap-y-6 md:gap-y-7">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <TrackItemSkeleton key={i} />
                    ))}
                </div>
            </div>
        </div>
    );
}
