import TrackItemSkeleton from "../components/track/TrackItemSkeleton.jsx";

export default function HomePageSkeleton() {

    return (
        <div className="animate-pulse px-3">
            <div className="flex max-lg:flex-col gap-x-10 items-center z-[1] relative py-14">
                <div className="shrink-0 w-80 h-80 rounded-2xl bg-gray-200 dark:bg-neutral-700"></div>
                <div className="grow max-lg:w-full max-lg:mt-5">
                    <div className="w-1/6 h-3 mb-2 lg:mb-5 bg-gray-200 dark:bg-neutral-700 rounded"></div>
                    <div className="w-2/3 h-5 bg-gray-200 dark:bg-neutral-700 rounded"></div>
                    <div className="flex mt-5 lg:mt-8">
                        <ul className="flex flex-wrap gap-[3px] lg:gap-2">
                            {Array.from({length: 8}).map((_, i) => (
                                <li key={i}
                                    className="inline-block w-10 h-2 bg-gray-200 dark:bg-neutral-700 rounded">
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="relative mt-1 md:mt-16">
                <div className="flex flex-wrap items-center justify-between relative mb-5 md:mb-10 md:pr-64">
                    <div className="w-1/6 h-4 bg-gray-200 dark:bg-neutral-700 rounded"></div>
                    <div className="shrink-0 flex gap-x-1 items-center">
                        <div className="mr-1 bg-gray-200 dark:bg-neutral-700 rounded"></div>
                        <div className="w-6 h-6 bg-gray-200 dark:bg-neutral-700 rounded"></div>
                        <div className="w-6 h-6 bg-gray-200 dark:bg-neutral-700 rounded"></div>
                    </div>
                    <div className="relative md:absolute md:right-0 w-full h-6 md:w-60 max-md:mt-3 bg-gray-200 dark:bg-neutral-700 rounded"></div>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-x-4 gap-y-8 lg:gap-y-14 mt-6">
                    {Array.from({length: 12}).map((_, i) => (
                        <TrackItemSkeleton key={i}/>
                    ))}
                </div>
            </div>
        </div>
    );
}
