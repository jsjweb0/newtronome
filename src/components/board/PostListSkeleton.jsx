import {Search} from "lucide-react";

export default function PostListSkeleton({rows = 10}) {
    return (
        <div className="animate-pulse">
            <div className="w-full max-w-xl m-auto mt-4 md:mt-8 mb-5 text-center">
                <div className="flex flex-row items-center gap-2 relative">
                    <div className="relative w-full">
                      <span className="flex items-center absolute inset-y-0 start-0 z-20 ps-3.5">
                        <Search className="shrink-0 size-4 text-gray-300 dark:text-white/30"/>
                      </span>
                        <div className="py-3 ps-10 pe-30 w-full h-10 bg-gray-200 rounded-lg dark:bg-neutral-700"/>
                    </div>
                    <div className="flex items-center w-26 h-10 bg-gray-200 rounded-lg dark:bg-neutral-700"></div>
                </div>
            </div>
            <div className="flex justify-between items-center">
                <div className="w-12 h-6 bg-gray-200 rounded-full dark:bg-neutral-700"></div>
                <div className="flex justify-center items-center gap-2">
                    <div className="flex items-center w-26 h-12 bg-gray-200 rounded-lg dark:bg-neutral-700"></div>
                </div>
            </div>
            <div className="mt-8 animate-pulse">
                <div className="divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden text-gray-500 text-xs md:text-base text-left md:text-center dark:border-neutral-700 dark:text-neutral-400">
                    {Array.from({ length: rows }).map((_, i) => (
                        <div key={i} className="grid grid-cols-1 md:grid-cols-13 gap-2 px-4 py-6 items-center">
                            <div className="h-4 w-4 md:m-auto bg-gray-300 rounded dark:bg-neutral-700" />
                            <div className="md:col-span-7 h-4 bg-gray-300 rounded dark:bg-neutral-700"></div>
                            <div className="md:col-span-2 h-4 w-16 md:m-auto bg-gray-300 rounded dark:bg-neutral-700" />
                            <div className="h-4 w-4 md:m-auto bg-gray-300 rounded dark:bg-neutral-700" />
                            <div className="md:col-span-2 h-4 w-20 md:m-auto bg-gray-300 rounded dark:bg-neutral-700" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
