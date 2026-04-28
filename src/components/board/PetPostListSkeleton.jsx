import {Search} from "lucide-react";

export default function PetPostListSkeleton() {
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
                    <div className="group relative inline-flex items-center gap-x-3">
                        <div className="w-11 h-6 bg-gray-200 rounded-full dark:bg-neutral-700 relative">
                            <div
                                className="absolute top-1/2 left-0.5 -translate-y-1/2 size-5 bg-white rounded-full dark:bg-neutral-500 shadow transition"/>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex justify-between items-center">
                <div className="w-12 h-6 bg-gray-200 rounded-full dark:bg-neutral-700"></div>
                <div className="flex justify-center items-center gap-2">
                    <div className="flex items-center w-26 h-12 bg-gray-200 rounded-lg dark:bg-neutral-700"></div>
                    <div className="flex items-center w-26 h-12 bg-gray-200 rounded-lg dark:bg-neutral-700"></div>
                </div>
            </div>
            <ul className="grid grid-cols-1 grid-rows-2 xl:grid-cols-4 lg:grid-cols-3 gap-8 lg:gap-4 mt-8 md:mt-6">
                {Array.from({length: 12}).map((_, i) => (
                    <li key={i} className="relative w-full">
                        <div className="space-y-3">
                            {/* 이미지 영역 */}
                            <div className="aspect-3/2 bg-gray-200 rounded-2xl dark:bg-neutral-700"/>

                            <div className="pt-2">
                                {/* 품종/색상 */}
                                <div className="h-4 w-3/4 bg-gray-200 rounded-full dark:bg-neutral-700 mb-1"/>
                                {/* 공고기간 */}
                                <div className="h-3 w-full bg-gray-200 rounded-full dark:bg-neutral-700 mb-1"/>
                                {/* 보호소 */}
                                <div className="h-3 w-1/2 bg-gray-200 rounded-full dark:bg-neutral-700 mb-1"/>
                                {/* 상태 */}
                                <div className="h-3 w-1/3 bg-gray-200 rounded-full dark:bg-neutral-700 mb-1"/>
                                {/* 태그들 */}
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <div className="h-5 w-12 bg-gray-200 rounded-full dark:bg-neutral-700"/>
                                    <div className="h-5 w-20 bg-gray-200 rounded-full dark:bg-neutral-700"/>
                                    <div className="h-5 w-10 bg-gray-200 rounded-full dark:bg-neutral-700"/>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
