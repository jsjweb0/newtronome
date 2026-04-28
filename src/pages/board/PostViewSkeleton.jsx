export default function PostViewSkeleton() {
    return (
        <div className="max-w-[85rem] mx-auto px-4 animate-pulse">
            <div className="flex flex-row max-md:flex-col items-center justify-between gap-2 px-4 py-5 border-y border-gray-300">
                <div className="h-6 w-2/3 bg-gray-200 rounded-md dark:bg-neutral-700" />
                <div className="shrink-0 flex divide-x divide-gray-300 dark:divide-neutral-700">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-6 w-12 mx-2 bg-gray-200 rounded-full dark:bg-neutral-700" />
                    ))}
                </div>
            </div>

            <div className="py-5 px-3 md:py-12 md:px-7">
                <div className="h-80 bg-gray-200 rounded dark:bg-neutral-700" />
            </div>

            <div className="flex items-center justify-center gap-x-3 mt-8">
                <div className="h-4 w-8 bg-gray-300 rounded dark:bg-neutral-700" />
                <div className="h-4 w-8 bg-gray-300 rounded dark:bg-neutral-700" />
                <div className="h-4 w-8 bg-gray-300 rounded dark:bg-neutral-700" />
            </div>

            <div className="flex justify-center mt-6 md:mt-14">
                <div className="h-12 w-26 bg-gray-200 rounded dark:bg-neutral-700" />
            </div>
        </div>
    );
}
