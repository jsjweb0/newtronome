export default function PlayerBarSkeleton() {
  return (
    <div className="flex items-center gap-x-3 xl:gap-x-4 w-full h-full p-3 xl:px-6 xl:py-3 animate-pulse">
      {/* 커버 + 곡 정보 */}
      <div className="flex flex-1 items-center gap-3 min-w-0">
        <div className="shrink-0 size-12 xl:size-14 bg-gray-200 dark:bg-neutral-700 rounded-lg" />
        <div className="grow min-w-0">
          <div className="h-3.5 w-2/3 bg-gray-200 dark:bg-neutral-700 rounded" />
          <div className="h-2.5 w-1/3 mt-2 bg-gray-200 dark:bg-neutral-700 rounded" />
        </div>
      </div>

      {/* 컨트롤 + 진행바 (데스크톱) */}
      <div className="hidden xl:flex flex-[1.4] flex-col items-center gap-y-3">
        <div className="flex items-center gap-x-5">
          <div className="size-5 bg-gray-200 dark:bg-neutral-700 rounded-full" />
          <div className="size-5 bg-gray-200 dark:bg-neutral-700 rounded-full" />
          <div className="size-12 bg-gray-200 dark:bg-neutral-700 rounded-full" />
          <div className="size-5 bg-gray-200 dark:bg-neutral-700 rounded-full" />
          <div className="size-5 bg-gray-200 dark:bg-neutral-700 rounded-full" />
        </div>
        <div className="h-1 w-full bg-gray-200 dark:bg-neutral-700 rounded" />
      </div>

      {/* 우측 버튼 */}
      <div className="flex xl:flex-1 justify-end items-center gap-x-3">
        <div className="size-6 bg-gray-200 dark:bg-neutral-700 rounded-full" />
        <div className="size-6 bg-gray-200 dark:bg-neutral-700 rounded-full" />
        <div className="hidden xl:block size-6 bg-gray-200 dark:bg-neutral-700 rounded-full" />
        <div className="xl:hidden size-11 bg-gray-200 dark:bg-neutral-700 rounded-full" />
      </div>
    </div>
  );
}
