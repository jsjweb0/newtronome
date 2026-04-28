export default function TrackItemSkeleton() {

    return (
        <div className="animate-pulse max-w-60">
            <div className="group flex flex-1 flex-col items-center w-full">
                <div className="overflow-hidden block relative w-full rounded-lg pt-[100%] bg-gray-200 dark:bg-neutral-700"></div>
                <div className="block w-full mt-3 h-3 bg-gray-200 dark:bg-neutral-700 rounded"></div>
                <div className="block mt-3 w-1/2 h-2 bg-gray-200 dark:bg-neutral-700 rounded"></div>
            </div>
        </div>
    );
}