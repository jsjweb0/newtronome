export default function PlayerBarSkeleton() {
    return (
        <div className="flex gap-x-3 xl:gap-x-20 items-center relative w-full h-full text-white p-3 xl:p-4 animate-pulse">
            {/* 왼쪽 커버 */}
            <div className="xl:shrink-0 flex flex-1 items-center gap-2 xl:gap-4 xl:w-[426px] min-w-0">
                <div className="shrink-0 w-11 h-11 xl:w-21 xl:h-21 bg-gray-200 dark:bg-neutral-700 rounded" />
                {/* 제목 */}
                <div className="grow">
                    <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded" />
                    <div className="h-2 mt-2.5 bg-gray-200 dark:bg-neutral-700 rounded w-1/3" />
                </div>
            </div>

            {/* 메타 + 컨트롤 영역 */}
            <div className="flex-1 hidden xl:block">
                {/* 프로그레스 바 */}
                <div className="h-2 bg-gray-200 dark:bg-neutral-700 rounded w-full" />
            </div>

            <div className="xl:hidden shrink-0 w-11 h-11 bg-gray-200 dark:bg-neutral-700 rounded-full" />

            {/* 재생/이전/다음 버튼 자리 */}
            <div className="flex items-center gap-x-1.5 xl:gap-x-5 absolute right-16 xl:static">
                <div className="size-4 xl:size-7 bg-gray-200 dark:bg-neutral-700 rounded-full" />
                <div className="size-4 xl:size-7 bg-gray-200 dark:bg-neutral-700 rounded-full" />
                <div className="hidden xl:block w-8 h-8 bg-gray-200 dark:bg-neutral-700 rounded-full" />
            </div>
        </div>
    );
}
